import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { TokenService } from "./token.service";

@Injectable()
export class JwtUserGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (!token) throw new UnauthorizedException("Invalid or expired token");

    const payload = this.tokenService.decodeToken(token);
    if (!payload || payload.scope !== "user") throw new UnauthorizedException("Invalid or expired token");

    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException("User not found");

    request.user = user;
    return true;
  }
}
