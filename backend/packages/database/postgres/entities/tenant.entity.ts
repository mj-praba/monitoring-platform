import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "tenants" })
export class Tenant {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", unique: true })
  slug: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
