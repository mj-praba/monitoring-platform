import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { loadAppConfig } from "@app/common/config/configuration";
import { LoggerModule } from "@app/common/logger/logger.module";
import { DatabaseModule } from "@app/database/database.module";
import { AuthModule } from "./auth/auth.module";
import { DevicesModule } from "./devices/devices.module";
import { HealthController } from "./health/health.controller";
import { LocationsModule } from "./locations/locations.module";
import { TenantsModule } from "./tenants/tenants.module";
import { UsersModule } from "./users/users.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadAppConfig], envFilePath: ".env" }),
    LoggerModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    WorkspacesModule,
    LocationsModule,
    DevicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
