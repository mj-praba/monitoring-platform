import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Location } from "@app/database/postgres/entities";
import { LocationsController } from "./locations.controller";
import { LocationsService } from "./locations.service";

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
