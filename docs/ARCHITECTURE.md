# Architecture

Deeper technical reference for how `monitoring-platform` fits together. Start with the root
[`README.md`](../README.md) for the quickstart and product framing — this doc goes one level
deeper into *why* the pieces are shaped the way they are. See also `backend/README.md` and each
`apps/*`/`packages/*` directory's own `README.md` for implementation-level detail.

A rendered, visual version of the flows below lives at [`docs/architecture.html`](architecture.html)
(open it directly in a browser).

## System overview

Five independently deployable/runnable pieces:

| Component | Stack | Role |
| --- | --- | --- |
| `backend/apps/api` | NestJS | REST: auth, users, tenants, workspaces, locations, devices, health. Only process that mutates the Postgres schema or writes ClickHouse migrations. |
| `backend/apps/websocket` | Plain TypeScript | Real-time layer: `/ws/device/{id}` (device → Kafka) and `/ws/dashboard/{id}` (Kafka → browser). |
| `backend/apps/workers/ingestion-worker` | Plain TypeScript | Kafka consumer → MongoDB `device_metrics` writer. Durability half of the pipeline. |
| `backend/apps/workers/cron-worker` | Plain TypeScript | Expires stale pairing sessions, marks unresponsive devices offline. |
| `frontend/` | React + Vite | The SaaS dashboard: login, device list, pairing (QR), live Monitor page. |
| `mobile/` | Expo / React Native | Pairs with the dashboard, streams a phone's own stats while foregrounded. |
| `desktop/` | Electron + React | **Unrelated** standalone app — observes the *local machine's* own system metrics. Doesn't talk to any of the above. See `desktop/README.md`. |

`backend/` is its own small monorepo (`apps/` + `packages/`, one root `package.json`) so the four
backend processes never drift to different dependency versions. `frontend/`, `mobile/`, and
`desktop/` are each standalone (own `package.json`/lockfile).

## Data stores

| Store | Role | Written by | Durable? |
| --- | --- | --- | --- |
| **PostgreSQL** | System of record — tenants, workspaces, locations, roles/permissions, users, refresh tokens, devices, pairing sessions. | `apps/api` (schema, via TypeORM migrations only — `synchronize` is never `true`) | Yes |
| **MongoDB** | Metrics event stream — one document per device sample. | `apps/workers/ingestion-worker` | Yes |
| **Kafka** | Live transport between `apps/websocket` (producer) and its two consumers. Not storage in its own right — a pipe, not a destination. | `apps/websocket` | Only until consumer offsets commit |
| **Redis** | Wired into the stack (docker-compose service, config, `packages/database/redis`) but **no longer used** — Kafka replaced it as the metrics transport. Same "infra-only" status as ClickHouse. | — | — |
| **ClickHouse** | Wired into the stack (connection + its own migration runner) but **no application data written yet**. | — | — |

## Auth model

JWT access + refresh tokens (`packages/auth`). Every self-registered user gets a brand-new tenant
+ "Default Workspace" + "Home" location and becomes `admin` of it. Authorization is **scoped
RBAC**: a role assignment at the tenant level covers every workspace/location beneath it, a
workspace-level assignment covers its locations, a location-level assignment covers only itself.
Permissions are resolved fresh from Postgres on every check — never trusted from the JWT — so a
permission change takes effect immediately, no token reissue needed. `apps/api`'s
`PermissionsGuard` and `apps/websocket`'s dashboard-connection check both call the same
`hasPermission()`/`loadUserAssignments()` functions (`packages/auth/permissions.ts`); one
implementation, two call sites, no Nest-specific logic duplicated into the plain-TS process.

Devices carry their own device-scoped JWT (issued at pairing claim time), distinct from
user-scoped tokens — `apps/websocket` rejects a device token on `/ws/dashboard/*` and a user
token on `/ws/device/*`.

## Flow 1 — Device pairing

1. On the dashboard, the user clicks **Connect Device**. `POST /api/devices/pair/start`
   (authenticated, requires `devices:manage` at the target location) creates a short-lived
   pairing code scoped to that location; the dashboard renders it as a QR code.
2. On the phone, the user scans the QR (or types the 6-digit code). The Expo app calls
   `POST /api/devices/pair/claim` — no auth, the device has no credentials yet — which creates a
   `Device` row in the pre-authorized location and returns a device-scoped JWT.
3. The dashboard polls `GET /api/devices/pair/status/{code}` until the device shows as claimed,
   then navigates to that device's Monitor page.
4. `apps/workers/cron-worker`'s `expire-pairing-sessions` job marks any pairing code `expired`
   once its TTL passes, so an unclaimed code can't be claimed late.

## Flow 2 — Live metrics (the availability/consistency split)

This is the core design decision in the backend: **live delivery to a dashboard never waits on a
database write**, and a database write never waits on (or can be starved by) live delivery.

1. While the mobile app is foregrounded, it opens `WS /ws/device/{device_id}` (device-scoped JWT)
   and sends a metrics sample (battery, total RAM, disk free/total, CPU-load estimate) every ~2s.
   Backgrounding or closing the app closes the socket immediately — no more data leaves the
   device.
2. `apps/websocket` publishes each sample to Kafka: one topic, `device-metrics`, **keyed by
   `deviceId`** so all of one device's messages land on the same partition (preserving per-device
   ordering — the same guarantee a per-device Redis channel gave, without a topic-per-device
   explosion). It also updates the device's `status`/`lastSeenAt` in Postgres. Nothing else
   happens inline — this publish is fire-and-forget from the hot path's perspective.
3. Two independent consumer groups read that same topic, with opposite scaling semantics:
   - **`apps/workers/ingestion-worker`** — one **shared** group (`"ingestion-worker"`). Scaling
     this worker out shards the topic's partitions across instances, so a message is still
     persisted exactly once. Each message is parsed and inserted into MongoDB's `device_metrics`
     collection; a parse failure or a failed insert is logged and dropped, not retried (no
     dead-letter handling in this pass — Kafka *does* retain the message until this consumer's
     offset commits, so a future retry/DLQ strategy is possible without a transport change).
   - **`apps/websocket`'s own dashboard fan-out** — one group **per process instance**
     (`websocket-dashboard-fanout-<uuid>`, generated at boot). A distinct group name gets a *full
     copy* of the topic, so every horizontally-scaled `apps/websocket` instance sees every
     device's messages (it can't know in advance which dashboard connects to it). The consumer's
     handler does an in-memory lookup on a `DashboardRegistry` (`Map<deviceId, Set<WebSocket>>`,
     populated as `/ws/dashboard/{id}` connections open/close) and forwards the message straight
     to every matching local browser socket.
4. The dashboard's Monitor page opens `WS /ws/dashboard/{device_id}` — this is the
   **consistency**-oriented path: live, but only as available as that one WebSocket connection.
   `GET /api/devices/{id}/metrics/latest` (REST, `apps/api`, reads MongoDB) is the
   **availability**-oriented alternative: always answerable, but may lag by however long the
   ingestion worker's write took.
5. Belt-and-suspenders offline detection: `apps/websocket` marks a device `offline` immediately on
   a graceful WebSocket close; `apps/workers/cron-worker`'s `mark-stale-devices-offline` job
   catches the case a device drops off the network without the socket ever firing `close` (crash,
   killed process, connectivity loss) by checking `lastSeenAt` against a threshold every 60s.

**Why a topic per device would be wrong**: Kafka's unit of parallelism/retention is the
topic/partition, not a lightweight per-consumer filter the way a Redis channel is. An unbounded,
per-device topic count doesn't scale operationally. Keying one shared topic by device id gets the
ordering guarantee without that cost; the dashboard side pays for it instead with "every instance
consumes 100% of the topic's volume" — documented as a known trade-off, not a bug, in the root
README's "Current state" section and `backend/apps/websocket/README.md`.

## Deployment

- `Dockerfile` (backend) is multi-stage, one final target per app (`api`, `websocket`,
  `ingestion-worker`, `cron-worker`), all built from the same `pnpm build` output and lockfile.
- Root `docker-compose.yml` runs `postgres` / `mongo` / `redis` / `kafka` / `clickhouse` plus one
  service per backend target, each service's `depends_on` narrowed to the stores it actually
  talks to (e.g. `backend-ingestion-worker` depends on `mongo` + `kafka`, not `postgres` or
  `redis`).
- CI (`.github/workflows/pull-request-checks.yml`) runs `pnpm typecheck && pnpm build` against
  `backend/` on every PR. `cd.yml` builds and pushes `apps/api`'s image to ECR and rolls it out to
  an ECS service on merge to `main`. `desktop-release.yml` is a separate pipeline that packages
  the unrelated desktop app into Windows/Linux installers on a `desktop-v*` tag.

## Known trade-offs (by design, not oversights)

See the root README's "Current state" section for the full list (CPU-as-JS-thread-proxy on
mobile, scoped RBAC's "initial impl" boundary, Redis/ClickHouse wired-but-unused, the
one-consumer-per-instance Kafka fan-out cost). This document explains the *why* behind each; the
README keeps the summary.
