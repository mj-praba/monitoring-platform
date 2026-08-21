import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@app/database/postgres/entities";
import { TokenService } from "./token.service";

// Renamed from the old JwtUserGuard now that PermissionsGuard sits
// alongside it. Same responsibility: validate a user-scoped bearer access
// token and attach `request.user`. A device-scoped token (scope !== "user")
// is rejected here, before PermissionsGuard ever runs.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (!token) throw new UnauthorizedException("Invalid or expired token");

    const payload = this.tokenService.verifyToken(token);
    if (!payload || payload.scope !== "user") throw new UnauthorizedException("Invalid or expired token");

    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException("User not found");

    request.user = user;
    return true;
  }
}
