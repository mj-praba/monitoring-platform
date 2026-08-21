import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "@app/database/postgres/entities";

@Injectable()
export class WorkspacesService {
  constructor(@InjectRepository(Workspace) private readonly workspaces: Repository<Workspace>) {}

  findAllInTenant(tenantId: string): Promise<Workspace[]> {
    return this.workspaces.find({ where: { tenantId }, order: { createdAt: "DESC" } });
  }

  create(tenantId: string, name: string, slug: string): Promise<Workspace> {
    return this.workspaces.save(this.workspaces.create({ tenantId, name, slug }));
  }
}
