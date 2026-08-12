import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "pairing_sessions" })
export class PairingSession {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", unique: true })
  code: string;

  @Column({ type: "varchar", name: "owner_id" })
  ownerId: string;

  @Column({ type: "varchar", default: "pending" })
  status: "pending" | "claimed" | "expired";

  @Column({ type: "varchar", name: "device_id", nullable: true })
  deviceId: string | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
