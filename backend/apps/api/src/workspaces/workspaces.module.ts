import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Workspace } from "@app/database/postgres/entities";
import { WorkspacesController } from "./workspaces.controller";
import { WorkspacesService } from "./workspaces.service";

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
