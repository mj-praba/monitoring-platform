import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "@app/common/config/configuration";
import { RedisService } from "./redis.service";

// apps/api only. apps/websocket / apps/workers/* `new RedisService(config.redis)`
// directly in their own main.ts instead.
@Module({
  providers: [
    {
      provide: RedisService,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => new RedisService(config.get("redis", { infer: true })),
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
