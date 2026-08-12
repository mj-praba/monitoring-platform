import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { AppConfig } from "../config/configuration";
import { User } from "../entities/user.entity";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async register(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const existing = await this.users.findOneBy({ email });
    if (existing) throw new BadRequestException("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.users.create({ email, hashedPassword });
    await this.users.save(user);

    const token = this.tokenService.createToken(user.id, "user", this.config.get("accessTokenExpireMinutes"));
    return { access_token: token, token_type: "bearer" };
  }

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const user = await this.users.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = this.tokenService.createToken(user.id, "user", this.config.get("accessTokenExpireMinutes"));
    return { access_token: token, token_type: "bearer" };
  }
}
