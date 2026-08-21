import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "@app/database/postgres/entities";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
