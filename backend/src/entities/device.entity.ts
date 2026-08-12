import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "devices" })
export class Device {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", name: "owner_id" })
  ownerId: string;

  @Column({ type: "varchar", default: "Android device" })
  name: string;

  @Column({ type: "varchar", default: "android" })
  platform: string;

  @Column({ type: "varchar", name: "device_token", unique: true })
  deviceToken: string;

  @Column({ type: "varchar", default: "offline" })
  status: "online" | "offline";

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @Column({ type: "timestamptz", name: "last_seen_at", nullable: true })
  lastSeenAt: Date | null;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
