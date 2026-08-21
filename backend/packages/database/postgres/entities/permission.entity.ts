import { randomUUID } from "crypto";
import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "permissions" })
export class Permission {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", unique: true })
  code: string;

  @Column({ type: "varchar" })
  description: string;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
