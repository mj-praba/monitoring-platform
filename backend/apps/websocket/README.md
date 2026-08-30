# apps/websocket

Plain TypeScript (no Nest) — the real-time, **consistency**-oriented half of the
availability/consistency split described in the root README. Owns a raw `ws` server routed by
URL path, exactly like the original single-process implementation, just as its own deployable
process now.

## Channels

- `/ws/device/{deviceId}?token=<device-scoped JWT>` — a device streams its own metrics. On each
  message: publish to Kafka (`DEVICE_METRICS_TOPIC`, keyed by `deviceId` via `deviceMetricsKey()`)
  and update the device's `status`/`lastSeenAt` in Postgres. **Nothing else** — no MongoDB write
  happens here; that's `apps/workers/ingestion-worker`'s job, consuming the same topic
  independently in its own `ingestion-worker` consumer group, so a slow/failed Mongo write can
  never delay live delivery to a dashboard.
- `/ws/dashboard/{deviceId}?token=<user-scoped JWT>` — registers the connection in this process's
  `DashboardRegistry` (`src/ws/dashboard-registry.ts`), keyed by device id, and forwards every
  matching message straight to the browser. Connection is rejected (403) unless the caller owns
  the device or holds `devices:read` at its location/workspace/tenant scope — same
  `hasPermission()` check `apps/api`'s `PermissionsGuard` uses (`@app/auth/permissions`), called
  directly here since there's no Nest guard in this process.

Full schema: `asyncapi.yaml` (AsyncAPI 2.6). Render it with
`npx @asyncapi/cli studio apps/websocket/asyncapi.yaml`.

## Why one shared Kafka consumer, not one per dashboard connection

Redis pub/sub let each dashboard connection cheaply subscribe to just its own device's channel.
Kafka's unit is a topic/partition, not a channel — a topic per device would be an unbounded
topic-count anti-pattern. Instead, `main.ts` opens exactly **one** Kafka consumer for the whole
process, in its own uniquely-named group (`websocket-dashboard-fanout-<randomUUID>`, generated at
boot), subscribed to the entire `device-metrics` topic. Its `eachMessage` handler does an
in-memory lookup on `DashboardRegistry` (`Map<deviceId, Set<WebSocket>>`) and dispatches to
whichever local browser connections are watching that device — `onDashboardSocketConnected` in
`ws.server.ts` is now just registry register/deregister, no Kafka calls at all.

Own group per process instance matters: a distinct consumer group gets a *full copy* of the
topic, so every horizontally-scaled `apps/websocket` instance sees every device's messages
(correct — it doesn't know in advance which dashboard will connect to it), rather than Kafka
load-balancing partitions across instances the way `apps/workers/ingestion-worker`'s single
shared group does. The trade-off: every instance consumes 100% of the topic's volume regardless
of local viewer count — the same "broadcast to all subscribers" cost Redis pub/sub already had,
not a new regression. See the root README's "Current state" section.

## Why it needs Postgres

Looking up a device by id (both channels) and resolving a dashboard caller's permissions both
require Postgres reads. `main.ts` opens its own plain `DataSource`
(`buildPostgresDataSourceOptions` from `@app/database/postgres/options`) — read-only in
practice, this process never runs migrations, that's `apps/api`'s job.

## Running

From `backend/`: `pnpm dev:websocket` or `pnpm build:websocket && pnpm start:websocket`. Listens
on `WS_PORT` (default `8002`) — a different port from `apps/api`'s `PORT`, since this is now a
separate process.
