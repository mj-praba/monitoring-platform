# apps/websocket

Plain TypeScript (no Nest) — the real-time, **consistency**-oriented half of the
availability/consistency split described in the root README. Owns a raw `ws` server routed by
URL path, exactly like the original single-process implementation, just as its own deployable
process now.

## Channels

- `/ws/device/{deviceId}?token=<device-scoped JWT>` — a device streams its own metrics. On each
  message: publish to Redis (`deviceChannel(deviceId)`) and update the device's `status`/
  `lastSeenAt` in Postgres. **Nothing else** — no MongoDB write happens here; that's
  `apps/workers/ingestion-worker`'s job, subscribing to the same Redis channel independently, so
  a slow/failed Mongo write can never delay live delivery to a dashboard.
- `/ws/dashboard/{deviceId}?token=<user-scoped JWT>` — subscribes to that device's Redis channel
  and forwards every message straight to the browser. Connection is rejected (403) unless the
  caller owns the device or holds `devices:read` at its location/workspace/tenant scope — same
  `hasPermission()` check `apps/api`'s `PermissionsGuard` uses (`@app/auth/permissions`), called
  directly here since there's no Nest guard in this process.

Full schema: `asyncapi.yaml` (AsyncAPI 2.6). Render it with
`npx @asyncapi/cli studio apps/websocket/asyncapi.yaml`.

## Why it needs Postgres

Looking up a device by id (both channels) and resolving a dashboard caller's permissions both
require Postgres reads. `main.ts` opens its own plain `DataSource`
(`buildPostgresDataSourceOptions` from `@app/database/postgres/options`) — read-only in
practice, this process never runs migrations, that's `apps/api`'s job.

## Running

From `backend/`: `pnpm dev:websocket` or `pnpm build:websocket && pnpm start:websocket`. Listens
on `WS_PORT` (default `8002`) — a different port from `apps/api`'s `PORT`, since this is now a
separate process.
