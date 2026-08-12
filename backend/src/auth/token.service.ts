import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";
import { AppConfig } from "../config/configuration";

export interface TokenPayload {
  sub: string;
  scope: "user" | "device";
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  createToken(subject: string, scope: "user" | "device", expiresMinutes: number): string {
    const secret: string = this.config.get("jwtSecret");
    return jwt.sign({ sub: subject, scope }, secret, {
      expiresIn: `${expiresMinutes}m`,
    });
  }

  decodeToken(token: string): TokenPayload | null {
    const secret: string = this.config.get("jwtSecret");
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch {
      return null;
    }
  }
}
