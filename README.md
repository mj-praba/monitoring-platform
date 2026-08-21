# monitoring-platform

A full-stack SaaS app for monitoring Android devices in real time:

- **`backend/`** - a small monorepo of its own (`apps/` + `packages/`, one root `package.json`):
  - `apps/api` (NestJS) - REST API: auth (JWT access + refresh tokens), users, tenants,
    workspaces, locations, devices. Swagger at `/api/docs`.
  - `apps/websocket` (plain TypeScript, no Nest) - the real-time WS layer: device-ingest and
    dashboard-subscribe sockets. AsyncAPI spec at `apps/websocket/asyncapi.yaml`.
  - `apps/workers/ingestion-worker` (plain TypeScript) - persists live metrics into MongoDB.
  - `apps/workers/cron-worker` (plain TypeScript) - expires stale pairing sessions, marks
    stale devices offline.
  - `packages/database` - Postgres (TypeORM, migrations) / MongoDB / Redis / ClickHouse, one
    sub-module each.
  - `packages/auth` - JWT + scoped RBAC (tenant -> workspace -> location, roles/permissions).
  - `packages/common` - shared types, constants, config loading, logging.
- **`frontend/`** - React + Vite + TypeScript web dashboard (the SaaS app)
- **`mobile/`** - Expo / React Native app that pairs with the dashboard and streams device stats
- **`desktop/`** - Electron + React + TypeScript app that observes the *local machine's* system
  metrics (CPU, memory, disk, load average, uptime, network) - unrelated to the mobile
  device-monitoring pipeline above; standalone boilerplate, see `desktop/README.md`.
- **`scripts/simulate-device.js`** - a fake "phone" for testing the pipeline without hardware

Backend, frontend, mobile, and desktop all use **pnpm** (not npm/yarn) - install it with
`npm install -g pnpm` or `corepack enable` if you don't have it.

> **Frontend/mobile compatibility note:** the backend's pairing/auth API contract changed as
> part of the `apps`/`packages` restructure (see `backend/README.md` for the full picture):
> `POST /api/devices/pair/start` now requires an authenticated caller and a `locationId` body
> field; login/register now also return a `refresh_token`; the WebSocket server moved to its
> own process/port (`WS_PORT`, default `8002`, not the API's `8001`). `frontend/` and
> `mobile/` were **not** updated as part of this change (backend-only scope) and will need
> corresponding updates before pairing/streaming works against the new backend.

## How it works

1. On the dashboard, click **Connect Device**. The backend creates a short-lived pairing
   code scoped to a specific location and the dashboard shows it as a QR code
   (`POST /api/devices/pair/start`, requires `devices:manage` at that location).
2. On the phone, open the app and scan that QR (or type the 6-digit code). The app calls
   `POST /api/devices/pair/claim` (no auth - the device has no credentials yet), which
   creates a `Device` row in that pre-authorized location and returns a device-scoped JWT.
3. While the app is in the **foreground**, it opens `WS /ws/device/{device_id}` (on
   `apps/websocket`, port `8002`) and sends a metrics sample (battery, total RAM, disk
   free/total, CPU) every ~2 seconds. Backgrounding or closing the app closes the socket
   immediately - no more data leaves the device.
4. `apps/websocket` publishes every incoming sample to a Redis channel
   (`device:{id}:metrics`) - nothing else happens inline. `apps/workers/ingestion-worker`
   subscribes to that same channel independently and archives each sample into MongoDB
   (`device_metrics` collection). This split is deliberate: WebSocket delivery to dashboards
   never waits on a database write.
5. The dashboard's Monitor page opens `WS /ws/dashboard/{device_id}`, which subscribes to
   that same Redis channel and forwards messages straight to the browser - live stat cards
   update in real time. This is the **consistency**-oriented path. `GET
   /api/devices/{id}/metrics/latest` (REST, `apps/api`) is the **availability**-oriented
   alternative: always answerable, may lag by however long the ingestion worker's write took.

Postgres holds structured app state (tenants, workspaces, locations, roles/permissions, users,
refresh tokens, devices, pairing sessions) - schema changes only via migrations, never
`synchronize`. MongoDB holds the metrics event stream. Redis is purely a pub/sub fan-out layer
between the device socket and any dashboard sockets watching that device. ClickHouse is wired
into the stack (connection + migration mechanism) but not yet storing application data.

## Quickstart

### 1. Infra

```bash
docker compose up -d postgres mongo redis clickhouse
```

### 2. Backend

```bash
cd backend
pnpm install
cp .env.example .env       # already backend-specific, sectioned by database
pnpm migration:run          # applies InitSchema + seeds roles/permissions/device types
pnpm seed:demo               # optional: creates a demo tenant + admin/user accounts, prints credentials

pnpm dev:api                 # REST API, http://localhost:8001 (/api/health, /api/docs)
pnpm dev:websocket            # separate process, ws://localhost:8002
pnpm dev:ingestion-worker      # separate process
pnpm dev:cron-worker            # separate process
```

All four processes read the same `backend/.env` and share one root `package.json` (no
per-app dependency versions to drift). See `backend/README.md` for what each app/package does
and the full script list (build/start variants, migration commands).

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Runs on http://localhost:5173. Register an account, then click **Connect Device**.

### 4. Pair a device

**Real phone:** run the Expo app (see below) and scan the QR shown by the dashboard.

**No phone handy?** Simulate one (pure Node.js, no dependencies - needs Node 22+ for native `fetch`/`WebSocket`):

```bash
node scripts/simulate-device.js --code 123456   # the code shown on the dashboard
```

The dashboard's Monitor page will start updating live, and the "Sending data" badge will
light up.

### 5. Mobile app (Expo)

```bash
cd mobile
pnpm install
pnpm start
```

Scan the Metro QR with Expo Go on an Android phone.

### 6. Desktop app (optional, standalone)

```bash
cd desktop
pnpm install
pnpm dev
```

Opens an Electron window showing live CPU/memory/disk/load/uptime/OS/network metrics for the
*local machine* it runs on. Doesn't talk to the backend/frontend/mobile pipeline above - see
`desktop/README.md` for the architecture and data sources.

## What the mobile app reports, and why nothing prompts for permission

`mobile/src/services/deviceStats.ts` only reads things Android exposes to any app with
**zero runtime permission dialogs**:

| Field | Source | Real or estimate |
| --- | --- | --- |
| `battery_level`, `battery_state` | `expo-battery` | Real |
| `total_memory_mb` | `expo-device` (`Device.totalMemory`) | Real (total device RAM) |
| `free_disk_mb`, `total_disk_mb` | `expo-file-system` (`getFreeDiskStorageAsync`/`getTotalDiskCapacityAsync`) | Real, and changes live as the phone's storage fills/frees |
| `device_model`, `os_version` | `expo-device` | Real, static |
| `cpu_load_estimate_percent` | measured `setTimeout` overshoot (JS-thread lag) | **Estimate** - see below |

There's no cross-platform, permission-free way to read true system-wide CPU utilization
or currently-used RAM on modern Android without root - that's an OS restriction, not
something a different library works around. `cpu_load_estimate_percent` is a genuine
measurement (how late a short timer fires, i.e. how busy the JS thread is), not random
noise, but treat it as a load *proxy* rather than a real CPU percentage.

## Project layout

```
backend/
  apps/api/src/                 NestJS: auth, users, tenants, workspaces, locations, devices, health
  apps/websocket/src/            plain TS: raw `ws` server, /ws/device/{id} + /ws/dashboard/{id}
  apps/workers/ingestion-worker/  plain TS: Redis subscriber -> MongoDB device_metrics writer
  apps/workers/cron-worker/        plain TS: expire pairing sessions, mark stale devices offline
  packages/database/              postgres (entities+migrations) / mongo / redis / clickhouse
  packages/auth/                   TokenService, refresh tokens, scoped RBAC permission checks
  packages/common/                 types, constants, config loading, logging
```

See `backend/README.md` and each `apps/*`/`packages/*` directory's own `README.md` for details.

```
frontend/src/
  api/client.ts                REST client + token storage
  hooks/useDashboardSocket.ts  dashboard WebSocket hook
  pages/Login.tsx, Devices.tsx, ConnectDevice.tsx, Monitor.tsx

mobile/src/
  services/api.ts, deviceStats.ts, socket.ts
  screens/ScanScreen.tsx, MonitorScreen.tsx
```

```
desktop/src/
  shared/                        IPC channel constants + types shared by main/preload/renderer
  main/metrics/                  one MetricCollector per domain (cpu/memory/disk/...), SystemMetricsService, MetricsPoller
  main/ipc/metrics.ipc.ts         wires the poller to ipcMain/webContents
  preload/index.ts                 contextBridge-exposed, typed window.metricsApi
  renderer/src/                     React dashboard: useSystemMetrics hook + one panel per metric domain
```

## Known MVP shortcuts (documented on purpose)

- **CPU is a JS-thread-load proxy, not a real percentage** - see the table above.
- **Single Redis pub/sub connection per dashboard socket** - fine for local dev; production
  would want connection pooling and reconnect/backoff on both device and dashboard sockets.
- **Scoped RBAC is an "initial impl"** - a global role/permission catalog (not per-tenant),
  `PermissionsGuard` resolves scope from routes by a documented convention rather than a fully
  generic resource resolver, and `user_role_assignments.scope_id` is an application-validated
  polymorphic reference, not a DB-level constraint. See `backend/README.md`.
- **ClickHouse is infra-only** - connection + migration mechanism wired up, no application
  data written to it yet.
