import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import { ScopeType } from "@app/common/constants/scope.constant";

// The core of the 3-level scoped RBAC model: grants `roleId`'s permissions
// to `userId`, limited to `scopeId` at the given `scopeType`. A "tenant"
// assignment cascades to every workspace/location beneath it; "workspace"
// cascades to its locations; "location" matches only itself — see
// @app/auth/permissions#hasPermission for the resolution logic.
//
// scopeId is intentionally polymorphic (points at tenants.id, workspaces.id,
// or locations.id depending on scopeType) rather than three nullable FK
// columns or a table per scope type. This is application-validated, not a
// DB-level constraint — see packages/database/README.md for the trade-off.
@Entity({ name: "user_role_assignments" })
export class UserRoleAssignment {
  @PrimaryColumn("varchar")
  id: string;

  @Column({ type: "varchar", name: "user_id" })
  userId: string;

  @Column({ type: "varchar", name: "role_id" })
  roleId: string;

  @Column({ type: "varchar", name: "scope_type" })
  scopeType: ScopeType;

  @Column({ type: "varchar", name: "scope_id" })
  scopeId: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
