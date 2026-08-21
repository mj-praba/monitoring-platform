import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar", name: "hashed_password" })
  hashedPassword: string;

  // The user's home tenant. Role/permission info is deliberately NOT
  // embedded on this row — it's derived by joining user_role_assignments
  // at request time (see @app/auth/permissions), so a permission change
  // takes effect immediately without re-issuing tokens.
  @Column({ type: "varchar", name: "tenant_id" })
  tenantId: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
