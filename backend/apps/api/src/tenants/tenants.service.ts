import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "@app/database/postgres/entities";

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private readonly tenants: Repository<Tenant>) {}

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenants.findOneBy({ id });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  create(name: string, slug: string): Promise<Tenant> {
    return this.tenants.save(this.tenants.create({ name, slug }));
  }
}
