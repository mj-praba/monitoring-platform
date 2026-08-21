import { randomBytes } from "crypto";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { DataSource, Repository } from "typeorm";
import { AppConfig } from "@app/common/config/configuration";
import { ROLE_CODES } from "@app/common/constants/permissions.constant";
import { SCOPE_TYPES } from "@app/common/constants/scope.constant";
import { Location, Role, Tenant, User, UserRoleAssignment, Workspace } from "@app/database/postgres/entities";
import { RefreshTokenService } from "@app/auth/refresh-token.service";
import { TokenService } from "@app/auth/token.service";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // Every self-registered user becomes admin of their own brand-new
  // tenant/workspace/"Home" location — preserves the original "register
  // then immediately pair your own devices" self-service flow, now fully
  // wired into the tenant -> workspace -> location hierarchy. Joining an
  // existing tenant (via invite) is out of scope for this pass.
  async register(email: string, password: string): Promise<AuthTokens> {
    const existing = await this.users.findOneBy({ email });
    if (existing) throw new BadRequestException("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminRole = await this.roles.findOneByOrFail({ code: ROLE_CODES.ADMIN });

    const user = await this.dataSource.transaction(async (manager) => {
      const tenant = await manager.save(
        Tenant,
        manager.create(Tenant, { name: `${email}'s workspace`, slug: this.slugify(email) }),
      );
      const workspace = await manager.save(
        Workspace,
        manager.create(Workspace, { tenantId: tenant.id, name: "Default Workspace", slug: "default" }),
      );
      await manager.save(Location, manager.create(Location, { workspaceId: workspace.id, name: "Home", type: "home" }));

      const newUser = await manager.save(User, manager.create(User, { email, hashedPassword, tenantId: tenant.id }));
      await manager.save(
        UserRoleAssignment,
        manager.create(UserRoleAssignment, {
          userId: newUser.id,
          roleId: adminRole.id,
          scopeType: SCOPE_TYPES.TENANT,
          scopeId: tenant.id,
        }),
      );
      return newUser;
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const rotated = await this.refreshTokenService.rotate(rawRefreshToken).catch(() => {
      throw new UnauthorizedException("Invalid or expired refresh token");
    });
    const user = await this.users.findOneByOrFail({ id: rotated.userId });

    return {
      access_token: this.createAccessToken(user),
      refresh_token: rotated.raw,
      token_type: "bearer",
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(rawRefreshToken);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const refreshToken = await this.refreshTokenService.issue(user.id);
    return {
      access_token: this.createAccessToken(user),
      refresh_token: refreshToken.raw,
      token_type: "bearer",
    };
  }

  private createAccessToken(user: User): string {
    const authConfig = this.config.get("auth", { infer: true });
    return this.tokenService.createAccessToken(user.id, "user", authConfig.accessTokenExpireMinutes, user.tenantId);
  }

  private slugify(email: string): string {
    const local = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `${local}-${randomBytes(3).toString("hex")}`;
  }
}
