import { createHash, randomBytes } from "crypto";
import { Repository } from "typeorm";
import { RefreshToken } from "@app/database/postgres/entities";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface IssuedRefreshToken {
  raw: string;
  expiresAt: Date;
}

// Plain class over a TypeORM Repository (not Nest DI) — opaque, high-entropy
// tokens, so a fast hash (sha256) is appropriate for storage; no need for
// bcrypt's deliberate slowness here.
export class RefreshTokenService {
  constructor(
    private readonly repo: Repository<RefreshToken>,
    private readonly expireDays: number,
  ) {}

  async issue(userId: string): Promise<IssuedRefreshToken> {
    const raw = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + this.expireDays * 24 * 60 * 60 * 1000);
    await this.repo.save(this.repo.create({ userId, tokenHash: hashToken(raw), expiresAt }));
    return { raw, expiresAt };
  }

  // Reuse of a revoked/unknown token is rejected outright. Treating that
  // reuse as a signal of theft and revoking the whole descendant chain is a
  // documented hardening follow-up, not implemented in this pass.
  async rotate(rawToken: string): Promise<{ userId: string } & IssuedRefreshToken> {
    const existing = await this.repo.findOne({ where: { tokenHash: hashToken(rawToken) } });
    if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
      throw new Error("Invalid or expired refresh token");
    }

    const next = await this.issue(existing.userId);
    const nextRow = await this.repo.findOneByOrFail({ tokenHash: hashToken(next.raw) });

    existing.revokedAt = new Date();
    existing.replacedById = nextRow.id;
    await this.repo.save(existing);

    return { userId: existing.userId, ...next };
  }

  async revoke(rawToken: string): Promise<void> {
    await this.repo.update({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
  }
}
