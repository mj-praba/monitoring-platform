import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig } from "@app/common/config/configuration";
import { buildPostgresDataSourceOptions } from "./options";

// apps/api only — the only process that mutates the Postgres schema or
// needs full Nest Repository DI. websocket/workers that read Postgres do
// so via a plain DataSource (buildPostgresDataSourceOptions +
// `new DataSource(...).initialize()`), not this module.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => buildPostgresDataSourceOptions(config.get("postgres", { infer: true })),
    }),
  ],
  exports: [TypeOrmModule],
})
export class PostgresModule {}
