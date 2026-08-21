// The 3-level RBAC scope hierarchy a role assignment can be pinned to:
// tenant (cascades to every workspace/location beneath it), workspace
// (cascades to its locations), or location (matches only itself).
export const SCOPE_TYPES = {
  TENANT: "tenant",
  WORKSPACE: "workspace",
  LOCATION: "location",
} as const;

export type ScopeType = (typeof SCOPE_TYPES)[keyof typeof SCOPE_TYPES];
