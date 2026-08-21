import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "@app/common/config/configuration";
import { ClickHouseService } from "./clickhouse.service";

// apps/api only — the only process that touches ClickHouse today
// (infra + migration mechanism, no application data yet).
@Module({
  providers: [
    {
      provide: ClickHouseService,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<AppConfig, true>) => {
        const service = new ClickHouseService(config.get("clickhouse", { infer: true }));
        await service.connect();
        return service;
      },
    },
  ],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
