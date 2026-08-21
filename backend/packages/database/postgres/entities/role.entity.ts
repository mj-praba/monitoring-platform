import { randomUUID } from "crypto";
import { BeforeInsert, Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "typeorm";
import { Permission } from "./permission.entity";

@Entity({ name: "roles" })
export class Role {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", unique: true })
  code: string;

  @Column({ type: "varchar" })
  description: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions: Permission[];

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
