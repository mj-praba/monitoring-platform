# apps/api

NestJS REST API — the only process in the stack that uses Nest, and the only one that mutates
the Postgres schema (it runs migrations at boot) or writes ClickHouse migrations.

## What's here

- `auth/` — register/login/refresh/logout. Every self-registered user gets a brand-new
  tenant + "Default Workspace" + "Home" location, and becomes `admin` of it (see
  `auth.service.ts`'s `register()`), preserving the original "register then immediately manage
  your own devices" flow now that a tenant hierarchy exists.
- `users/` — admin-scoped (`users:manage`) listing of users within the caller's tenant.
- `tenants/`, `workspaces/`, `locations/` — minimal CRUD over the scope hierarchy, gated by
  `tenants:manage` / `workspaces:manage` / `locations:manage`.
- `devices/` — pairing flow (`pair/start` → `pair/claim`, unchanged wire shape except
  `pair/start` now requires a `locationId` and `devices:manage` at that location) plus
  `GET /:id/metrics/latest`, the **availability**-oriented read of the latest MongoDB
  `device_metrics` document (compare with `apps/websocket`'s live push, the
  **consistency**-oriented path).
- `health/` — `GET /api/health`.
- `main.ts` — boot order matters: Postgres migrations → ClickHouse migrations → Swagger setup
  → `listen()`. A migration failure logs clearly and exits the process rather than serving
  traffic against a half-migrated schema.

## Auth model

Every protected route uses `@UseGuards(JwtAuthGuard, PermissionsGuard)` +
`@RequirePermission(PERMISSION_CODES.X)` from `@app/auth`, or just `JwtAuthGuard` alone for
routes that only need "any authenticated user" (e.g. `GET /api/tenants/me`). See
`packages/auth/README.md` for how permission resolution actually works — it's the same code
`apps/websocket` uses to gate dashboard connections.

## Swagger

`GET /api/docs` (bearer-auth scheme configured in `main.ts`). DTOs use `@ApiProperty()`;
coverage is intentionally light for this pass — extend as new endpoints are added, don't feel
obligated to backfill exhaustive annotations on everything at once.

## Running

From `backend/`: `pnpm dev:api` (watch mode) or `pnpm build:api && pnpm start:api`.
