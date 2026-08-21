import { randomUUID } from "crypto";
import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "device_types" })
export class DeviceType {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", unique: true })
  code: string;

  @Column({ type: "varchar" })
  label: string;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
