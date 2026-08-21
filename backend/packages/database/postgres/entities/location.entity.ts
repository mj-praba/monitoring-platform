import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

export type LocationType = "home" | "work" | "other";

// The narrowest level of the tenant -> workspace -> location scope
// hierarchy. Devices live inside a location; role assignments scoped
// here match only this location (see @app/auth/permissions).
@Entity({ name: "locations" })
export class Location {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", name: "workspace_id" })
  workspaceId: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", default: "other" })
  type: LocationType;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
