import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Location, LocationType } from "@app/database/postgres/entities";

@Injectable()
export class LocationsService {
  constructor(@InjectRepository(Location) private readonly locations: Repository<Location>) {}

  findAllInWorkspace(workspaceId: string): Promise<Location[]> {
    return this.locations.find({ where: { workspaceId }, order: { createdAt: "DESC" } });
  }

  create(workspaceId: string, name: string, type: LocationType): Promise<Location> {
    return this.locations.save(this.locations.create({ workspaceId, name, type }));
  }
}
