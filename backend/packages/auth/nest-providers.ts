import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppConfig } from "@app/common/config/configuration";
import { RefreshToken } from "@app/database/postgres/entities";
import { RefreshTokenService } from "./refresh-token.service";
import { TokenService } from "./token.service";

// apps/api only. TokenService/RefreshTokenService are plain classes (see
// their own files) — Nest can't auto-instantiate a plain class whose
// constructor takes a string/Repository, so these factory providers are
// the glue. Registered once in apps/api/src/auth/auth.module.ts.
export const tokenServiceProvider: Provider = {
  provide: TokenService,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppConfig, true>) => new TokenService(config.get("auth", { infer: true }).jwtSecret),
};

export const refreshTokenServiceProvider: Provider = {
  provide: RefreshTokenService,
  inject: [ConfigService, getRepositoryToken(RefreshToken)],
  useFactory: (config: ConfigService<AppConfig, true>, repo: Repository<RefreshToken>) =>
    new RefreshTokenService(repo, config.get("auth", { infer: true }).refreshTokenExpireDays),
};
