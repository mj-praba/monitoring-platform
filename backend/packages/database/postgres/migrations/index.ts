import { InitSchema1786996848386 } from "./1786996848386-InitSchema";
import { SeedRolesAndPermissions1786996900000 } from "./1786996900000-SeedRolesAndPermissions";

// Explicit list of migration classes, in run order. Kept explicit (not a
// glob) so it resolves identically under ts-node and every app's compiled
// dist — see packages/database/README.md. After `pnpm migration:generate`
// writes a new file here, add its exported class to this array by hand.
export const MIGRATIONS: Function[] = [InitSchema1786996848386, SeedRolesAndPermissions1786996900000];
