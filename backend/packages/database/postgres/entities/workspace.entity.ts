import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "workspaces" })
@Index(["tenantId", "slug"], { unique: true })
export class Workspace {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", name: "tenant_id" })
  tenantId: string;

  @Column({ type: "varchar" })
  name: string;

  // Unique per tenant (see the composite index above), not globally.
  @Column({ type: "varchar" })
  slug: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
