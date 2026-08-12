import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { AppModule } from "./app.module";
import { TokenService } from "./auth/token.service";
import { AppConfig } from "./config/configuration";
import { Device } from "./entities/device.entity";
import { MongoService } from "./mongo/mongo.service";
import { RedisService } from "./redis/redis.service";
import { attachWebSocketServer } from "./ws/ws.server";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  app.enableCors({
    origin: config.get("corsOrigins"),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = config.get("port");
  await app.listen(port);

  attachWebSocketServer(app.getHttpServer(), {
    deviceRepo: app.get<Repository<Device>>(getRepositoryToken(Device)),
    tokenService: app.get(TokenService),
    redisService: app.get(RedisService),
    mongoService: app.get(MongoService),
  });

  console.log(`monitoring-platform backend listening on port ${port}`);
}

bootstrap();
