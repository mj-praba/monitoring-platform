# monitoring-platform

A full-stack SaaS app for monitoring Android devices in real time:

- **`backend/`** - NestJS (TypeScript), TypeORM (Postgres) + native `mongodb` driver (MongoDB)
  + `ioredis` pub/sub, a raw `ws` WebSocket server
- **`frontend/`** - React + Vite + TypeScript web dashboard (the SaaS app)
- **`mobile/`** - Expo / React Native app that pairs with the dashboard and streams device stats
- **`scripts/simulate-device.js`** - a fake "phone" for testing the pipeline without hardware

Backend, frontend, and mobile all use **pnpm** (not npm/yarn) - install it with
`npm install -g pnpm` or `corepack enable` if you don't have it.

## How it works

1. On the dashboard, click **Connect Device**. The backend creates a short-lived pairing
   code and the dashboard shows it as a QR code (`POST /api/devices/pair/start`).
2. On the phone, open the app and scan that QR (or type the 6-digit code). The app calls
   `POST /api/devices/pair/claim`, which creates a `Device` row and returns a device-scoped
   JWT.
3. While the app is in the **foreground**, it opens `WS /ws/device/{device_id}` and sends a
   metrics sample (battery, total RAM, disk free/total, CPU) every ~2 seconds. Backgrounding
   or closing the app closes the socket immediately - no more data leaves the device.
4. The backend publishes every incoming sample to a Redis channel (`device:{id}:metrics`)
   and archives it in MongoDB (`device_metrics` collection).
5. The dashboard's Monitor page opens `WS /ws/dashboard/{device_id}`, which subscribes to
   that same Redis channel and forwards messages straight to the browser - live stat cards
   update in real time.

Postgres holds structured app state (users, devices, pairing sessions). MongoDB holds the
metrics event stream. Redis is purely a pub/sub fan-out layer between the device socket and
any dashboard sockets watching that device.

## Quickstart

### 1. Infra

```bash
docker compose up -d postgres mongo redis
```

### 2. Backend

```bash
cd backend
pnpm install
cp ../.env.example .env   # then trim it down to just the backend section
pnpm dev
```

Runs on http://localhost:8000 (`/api/health` for a quick check). Tables are created
automatically on startup (TypeORM `synchronize: true`) - no separate migration step needed.

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
backend/src/
  main.ts                     bootstrap, CORS, ValidationPipe, attaches the raw WS server
  app.module.ts                wires Postgres/Mongo/Redis + feature modules
  config/configuration.ts      env-driven config (DB URLs, JWT secret, CORS origins)
  entities/                    TypeORM: User, Device, PairingSession
  auth/                        register/login, JWT create/verify, guard
  devices/                     pairing start/status/claim + device list/get endpoints
  mongo/mongo.service.ts       native `mongodb` driver connection + device_metrics collection
  redis/redis.service.ts       ioredis publisher + per-connection subscriber factory
  ws/ws.server.ts               raw `ws` server attached to Nest's HTTP server, routing
                                /ws/device/{id} and /ws/dashboard/{id} by URL

frontend/src/
  api/client.ts                REST client + token storage
  hooks/useDashboardSocket.ts  dashboard WebSocket hook
  pages/Login.tsx, Devices.tsx, ConnectDevice.tsx, Monitor.tsx

mobile/src/
  services/api.ts, deviceStats.ts, socket.ts
  screens/ScanScreen.tsx, MonitorScreen.tsx
```

## Known MVP shortcuts (documented on purpose)

- **No migration tool** - tables are created with TypeORM's `synchronize: true` on startup.
  Switch to real migrations (`typeorm migration:generate`) before this schema needs to
  evolve in production.
- **CPU is a JS-thread-load proxy, not a real percentage** - see the table above.
- **Single Redis pub/sub connection per dashboard socket** - fine for local dev; production
  would want connection pooling and reconnect/backoff on both device and dashboard sockets.
