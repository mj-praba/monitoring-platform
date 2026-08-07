import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from './config';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './common/logger/logger.module';
import { TestValidationController } from './common/dto/test-validation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig],
    }),
    LoggerModule,
    HealthModule,
  ],
  controllers: [TestValidationController],
  providers: [],
})
export class AppModule {}
