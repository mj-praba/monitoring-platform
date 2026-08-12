import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtUserGuard } from "./jwt-user.guard";
import { TokenService } from "./token.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtUserGuard],
  exports: [TokenService, JwtUserGuard, TypeOrmModule],
})
export class AuthModule {}
