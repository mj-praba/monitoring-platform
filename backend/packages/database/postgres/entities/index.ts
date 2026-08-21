export * from "./tenant.entity";
export * from "./workspace.entity";
export * from "./location.entity";
export * from "./permission.entity";
export * from "./role.entity";
export * from "./user-role-assignment.entity";
export * from "./user.entity";
export * from "./device-type.entity";
export * from "./device.entity";
export * from "./pairing-session.entity";
export * from "./refresh-token.entity";

import { Tenant } from "./tenant.entity";
import { Workspace } from "./workspace.entity";
import { Location } from "./location.entity";
import { Permission } from "./permission.entity";
import { Role } from "./role.entity";
import { UserRoleAssignment } from "./user-role-assignment.entity";
import { User } from "./user.entity";
import { DeviceType } from "./device-type.entity";
import { Device } from "./device.entity";
import { PairingSession } from "./pairing-session.entity";
import { RefreshToken } from "./refresh-token.entity";

// Explicit list (not a glob) so the CLI DataSource, the Nest module, and
// every app that opens its own DataSource all see exactly the same set,
// resolved identically whether running under ts-node or compiled dist.
export const ALL_ENTITIES = [
  Tenant,
  Workspace,
  Location,
  Permission,
  Role,
  UserRoleAssignment,
  User,
  DeviceType,
  Device,
  PairingSession,
  RefreshToken,
];
