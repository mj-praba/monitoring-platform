import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "@app/common/config/configuration";
import { MongoService } from "./mongo.service";

// apps/api only. apps/websocket / apps/workers/ingestion-worker `new
// MongoService(config.mongo)` directly in their own main.ts instead.
@Module({
  providers: [
    {
      provide: MongoService,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<AppConfig, true>) => {
        const service = new MongoService(config.get("mongo", { infer: true }));
        await service.connect();
        return service;
      },
    },
  ],
  exports: [MongoService],
})
export class MongoModule {}
