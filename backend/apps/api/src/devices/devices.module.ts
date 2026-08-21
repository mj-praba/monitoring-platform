import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Device,
  DeviceType,
  Location,
  PairingSession,
  Role,
  UserRoleAssignment,
  Workspace,
} from "@app/database/postgres/entities";
import { DevicesController } from "./devices.controller";
import { DevicesService } from "./devices.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, PairingSession, DeviceType, Location, Workspace, UserRoleAssignment, Role]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
