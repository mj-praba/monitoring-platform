import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./common/logger/logger.module";
import { normalizePostgresUrl } from "./common/postgres-url.util";
import configuration, { AppConfig } from "./config/configuration";
import { DevicesModule } from "./devices/devices.module";
import { HealthController } from "./health/health.controller";
import { MongoModule } from "./mongo/mongo.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: ".env" }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        type: "postgres" as const,
        url: normalizePostgresUrl(config.get("postgresUrl")),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    MongoModule,
    RedisModule,
    AuthModule,
    DevicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
