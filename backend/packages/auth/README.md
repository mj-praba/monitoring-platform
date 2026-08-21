# @app/auth

Token issuance/verification and the scoped RBAC permission model, split into a framework-agnostic core
(usable from any process) and a thin Nest layer (`apps/api` only).

## Framework-agnostic (usable from any app)

- `token.service.ts` — `TokenService`, plain class, `new TokenService(jwtSecret)`. `createAccessToken` /
  `verifyToken`. Payload is deliberately slim (`sub`, `scope`, `tenantId`, `exp`) — no roles/permissions
  embedded, see `permissions.ts` below for why.
- `refresh-token.service.ts` — `RefreshTokenService`, plain class over a `Repository<RefreshToken>`.
  `issue` / `rotate` / `revoke`. Only a sha256 hash of the refresh token is ever stored.
- `permissions.ts` — `loadUserAssignments(...)` (one query resolving a user's role assignments + their
  permission codes) and `hasPermission(assignments, code, target)` (the scope-cascade check: a
  tenant-level assignment covers every workspace/location beneath it, workspace covers its locations,
  location covers only itself). **Permissions are resolved fresh from the database on every check, never
  trusted from the JWT** — a permission change takes effect immediately, no token reissue needed.
  `apps/websocket` calls these two functions directly (no Nest) to gate dashboard connections by
  `devices:read`; `apps/api`'s `PermissionsGuard` calls the same functions.

## Nest-only (`apps/api`)

- `jwt-auth.guard.ts` — `JwtAuthGuard`. Validates the bearer access token, loads the `User`, attaches
  `request.user`. Rejects device-scoped tokens outright.
- `permissions.guard.ts` + `require-permission.decorator.ts` — `PermissionsGuard` / `@RequirePermission(code)`.
  Runs after `JwtAuthGuard`. Resolves a `ScopeTarget` from the route by convention: a `locationId` in
  params/query/body is walked up to its workspace/tenant; a `workspaceId` resolves its tenant; otherwise
  the caller's own tenant is the target. This convention (not a fully generic resource-scope resolver) is
  the deliberate "initial impl" boundary — extend `PermissionsGuard.resolveScopeTarget` if a future route
  needs a different resolution path.
- `current-user.decorator.ts` / `current-tenant.decorator.ts` — `@CurrentUser()` / `@CurrentTenant()`.
- `nest-providers.ts` — factory providers wiring `TokenService`/`RefreshTokenService` into Nest's DI
  container (they're plain classes, so Nest can't `new` them without a factory telling it what config to
  pass). Registered once, in `apps/api/src/auth/auth.module.ts`.

## How to use it

```ts
// apps/api controller
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSION_CODES.DEVICES_MANAGE)
@Post()
createDevice(@CurrentUser() user: User, @Body() dto: CreateDeviceDto) { ... }
```

```ts
// apps/websocket (plain TS) — same functions, no guard class
const assignments = await loadUserAssignments(assignmentRepo, roleRepo, userId);
if (!hasPermission(assignments, PERMISSION_CODES.DEVICES_READ, { tenantId, workspaceId, locationId })) {
  // reject the connection
}
```
