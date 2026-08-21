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

  // Locked in at pairStart (an authenticated call, checked against
  // devices:manage for this location) so the unauthenticated pairClaim
  // call — made by the new device itself, before it has any credentials —
  // never needs to make its own authorization decision.
  @Column({ type: "varchar", name: "location_id" })
  locationId: string;

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
