import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

// Only tokenHash (sha256 of the raw refresh token) is ever stored — the raw
// token is returned to the client once at issue/rotation time and never
// persisted. See @app/auth/refresh-token.service for the rotation flow.
@Entity({ name: "refresh_tokens" })
export class RefreshToken {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", name: "user_id" })
  userId: string;

  @Column({ type: "varchar", name: "token_hash", unique: true })
  tokenHash: string;

  @CreateDateColumn({ type: "timestamptz", name: "issued_at" })
  issuedAt: Date;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt: Date;

  @Column({ type: "timestamptz", name: "revoked_at", nullable: true })
  revokedAt: Date | null;

  // Rotation chain: when this token is used to refresh, the new token's id
  // is recorded here and this row is marked revoked.
  @Column({ type: "varchar", name: "replaced_by_id", nullable: true })
  replacedById: string | null;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
