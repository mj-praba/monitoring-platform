import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@app/database/postgres/entities";
import { toUserOut, UserOut } from "./users.mapper";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findAllInTenant(tenantId: string): Promise<UserOut[]> {
    const rows = await this.users.find({ where: { tenantId }, order: { createdAt: "DESC" } });
    return rows.map(toUserOut);
  }
}
