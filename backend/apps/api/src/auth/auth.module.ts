import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Location,
  RefreshToken,
  Role,
  Tenant,
  User,
  UserRoleAssignment,
  Workspace,
} from "@app/database/postgres/entities";
import { JwtAuthGuard } from "@app/auth/jwt-auth.guard";
import { refreshTokenServiceProvider, tokenServiceProvider } from "@app/auth/nest-providers";
import { PermissionsGuard } from "@app/auth/permissions.guard";
import { RefreshTokenService } from "@app/auth/refresh-token.service";
import { TokenService } from "@app/auth/token.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

// @Global() so JwtAuthGuard/PermissionsGuard/TokenService/RefreshTokenService
// are usable from any other module's controllers via @UseGuards(...) without
// each of them having to import AuthModule explicitly.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant, Workspace, Location, Role, UserRoleAssignment, RefreshToken])],
  controllers: [AuthController],
  providers: [AuthService, tokenServiceProvider, refreshTokenServiceProvider, JwtAuthGuard, PermissionsGuard],
  exports: [TypeOrmModule, TokenService, RefreshTokenService, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
