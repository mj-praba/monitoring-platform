import { Global, Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";

import { loggerConfig } from "./logger.config";

@Global()
@Module({
  imports: [WinstonModule.forRoot(loggerConfig)],
  exports: [WinstonModule],
})
export class LoggerModule {}
