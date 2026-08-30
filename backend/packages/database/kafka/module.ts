import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "@app/common/config/configuration";
import { KafkaService } from "./kafka.service";

// Structural parity with every other packages/database/* sub-module only —
// NOT currently imported by database.module.ts. apps/api never touches the
// device-metrics pipeline (see packages/database/README.md); it has no
// producer or consumer of its own, so this module has nothing to wire into
// yet. Import it into database.module.ts's imports/exports if that changes.
@Module({
  providers: [
    {
      provide: KafkaService,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<AppConfig, true>) => {
        const service = new KafkaService(config.get("kafka", { infer: true }));
        await service.connect();
        return service;
      },
    },
  ],
  exports: [KafkaService],
})
export class KafkaModule {}
