import { In, Repository } from "typeorm";
import { Role, UserRoleAssignment } from "@app/database/postgres/entities";
import { ScopeType, SCOPE_TYPES } from "@app/common/constants/scope.constant";

export interface ScopeTarget {
  tenantId: string;
  workspaceId?: string;
  locationId?: string;
}

export interface ResolvedAssignment {
  scopeType: ScopeType;
  scopeId: string;
  permissionCodes: Set<string>;
}

// One query per request (not N+1 per permission check) — call this once
// per request (apps/api's PermissionsGuard) or once per connection
// (apps/websocket's dashboard handler), then check as many permissions as
// needed against the same result via hasPermission().
export async function loadUserAssignments(
  assignmentRepo: Repository<UserRoleAssignment>,
  roleRepo: Repository<Role>,
  userId: string,
): Promise<ResolvedAssignment[]> {
  const assignments = await assignmentRepo.find({ where: { userId } });
  if (assignments.length === 0) return [];

  const roleIds = [...new Set(assignments.map((a) => a.roleId))];
  // Role.permissions is an eager relation, so this single query also
  // resolves the permission codes for every role in one round trip.
  const roles = await roleRepo.findBy({ id: In(roleIds) });
  const rolesById = new Map(roles.map((role) => [role.id, role]));

  return assignments.map((assignment) => ({
    scopeType: assignment.scopeType,
    scopeId: assignment.scopeId,
    permissionCodes: new Set((rolesById.get(assignment.roleId)?.permissions ?? []).map((p) => p.code)),
  }));
}

// A "tenant" assignment cascades to every workspace/location beneath it
// (the caller resolves target.workspaceId/locationId up front from the
// resource being acted on); "workspace" cascades to its locations;
// "location" matches only itself.
export function hasPermission(assignments: ResolvedAssignment[], code: string, target: ScopeTarget): boolean {
  return assignments.some((assignment) => {
    if (!assignment.permissionCodes.has(code)) return false;

    switch (assignment.scopeType) {
      case SCOPE_TYPES.TENANT:
        return assignment.scopeId === target.tenantId;
      case SCOPE_TYPES.WORKSPACE:
        return target.workspaceId !== undefined && assignment.scopeId === target.workspaceId;
      case SCOPE_TYPES.LOCATION:
        return target.locationId !== undefined && assignment.scopeId === target.locationId;
      default:
        return false;
    }
  });
}
