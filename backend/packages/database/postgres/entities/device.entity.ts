import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "devices" })
export class Device {
  @PrimaryColumn("varchar")
  id: string;

  // Kept for "my devices" lookups (who paired it). Scoped permission
  // checks key off locationId instead, not ownerId.
  @Column({ type: "varchar", name: "owner_id" })
  ownerId: string;

  @Column({ type: "varchar", name: "device_type_id" })
  deviceTypeId: string;

  @Column({ type: "varchar", name: "location_id" })
  locationId: string;

  @Column({ type: "varchar", default: "Android device" })
  name: string;

  @Column({ type: "varchar", default: "android" })
  platform: string;

  @Column({ type: "varchar", name: "device_token", unique: true })
  deviceToken: string;

  @Column({ type: "varchar", default: "offline" })
  status: "online" | "offline";

  // Type-specific attributes (mobile: os_version, desktop: os_name, iot:
  // firmware_version, ...) — a lookup table (device_types) + flexible
  // column, not one table per device type, to stay extensible without
  // inheritance complexity.
  @Column({ type: "jsonb", default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @Column({ type: "timestamptz", name: "last_seen_at", nullable: true })
  lastSeenAt: Date | null;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
