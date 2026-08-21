export const PERMISSION_CODES = {
  DEVICES_READ: "devices:read",
  DEVICES_MANAGE: "devices:manage",
  USERS_MANAGE: "users:manage",
  ROLES_MANAGE: "roles:manage",
  TENANTS_MANAGE: "tenants:manage",
  WORKSPACES_MANAGE: "workspaces:manage",
  LOCATIONS_MANAGE: "locations:manage",
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

export const ROLE_CODES = {
  ADMIN: "admin",
  USER: "user",
  VIEWER: "viewer",
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

// Single source of truth for which permissions each seeded role carries —
// read by both the SeedRolesAndPermissions migration and the demo seed
// script, so the two can never drift apart.
export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  [ROLE_CODES.ADMIN]: [
    PERMISSION_CODES.TENANTS_MANAGE,
    PERMISSION_CODES.WORKSPACES_MANAGE,
    PERMISSION_CODES.LOCATIONS_MANAGE,
    PERMISSION_CODES.DEVICES_MANAGE,
    PERMISSION_CODES.DEVICES_READ,
    PERMISSION_CODES.USERS_MANAGE,
    PERMISSION_CODES.ROLES_MANAGE,
  ],
  [ROLE_CODES.USER]: [PERMISSION_CODES.DEVICES_MANAGE, PERMISSION_CODES.DEVICES_READ],
  [ROLE_CODES.VIEWER]: [PERMISSION_CODES.DEVICES_READ],
};

export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  [ROLE_CODES.ADMIN]: "Full management access within the assignment's scope",
  [ROLE_CODES.USER]: "Self-service: manage and read own devices within the assignment's scope",
  [ROLE_CODES.VIEWER]: "Read-only access within the assignment's scope",
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  [PERMISSION_CODES.DEVICES_READ]: "List and read devices and their latest metrics",
  [PERMISSION_CODES.DEVICES_MANAGE]: "Pair, update, and remove devices",
  [PERMISSION_CODES.USERS_MANAGE]: "List users and manage their role assignments",
  [PERMISSION_CODES.ROLES_MANAGE]: "Manage roles and their permissions",
  [PERMISSION_CODES.TENANTS_MANAGE]: "Manage tenants",
  [PERMISSION_CODES.WORKSPACES_MANAGE]: "Manage workspaces",
  [PERMISSION_CODES.LOCATIONS_MANAGE]: "Manage locations",
};
