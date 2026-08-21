import jwt from "jsonwebtoken";
import { TokenPayload, TokenScope } from "@app/common/types/auth.types";

// Plain class — `new TokenService(jwtSecret)` — usable from apps/api (via a
// Nest factory provider, see nest-providers.ts) and directly from
// apps/websocket / apps/workers/* with no DI container involved.
export class TokenService {
  constructor(private readonly jwtSecret: string) {}

  createAccessToken(subject: string, scope: TokenScope, expiresMinutes: number, tenantId?: string): string {
    return jwt.sign({ sub: subject, scope, tenantId }, this.jwtSecret, {
      expiresIn: `${expiresMinutes}m`,
    });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }
}
