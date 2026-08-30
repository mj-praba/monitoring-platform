# backend

A small monorepo of its own: four deployable apps sharing three packages, all resolved from
**one root `package.json`** so no dependency ever drifts to a different version between
processes.

```
backend/
  apps/
    api/                 NestJS. REST: auth, users, tenants, workspaces, locations, devices, health.
    websocket/            Plain TypeScript (no Nest). Real-time device/dashboard WebSocket server.
    workers/
      ingestion-worker/   Plain TypeScript. Redis -> MongoDB metrics persistence.
      cron-worker/         Plain TypeScript. Expire pairing sessions, mark stale devices offline.
  packages/
    database/             Postgres (TypeORM + migrations) / MongoDB / Redis / Kafka / ClickHouse.
    auth/                  JWT (access + refresh) and scoped RBAC (tenant -> workspace -> location).
    common/                 Shared types, constants, config loading, logging, HTTP error handling.
```

Each `apps/*` and `packages/*` directory has its own `README.md` with specifics. This file covers
how the pieces fit together and how to run them.

## Why only `apps/api` uses NestJS

Nest's DI/decorator machinery earns its keep where there are controllers, guards, and Swagger to
wire up — `api`. It's unnecessary ceremony on a process that just drains a Kafka topic or ticks
a timer, so `websocket` and both workers are plain TypeScript: a small hand-composed `main.ts`
that constructs the classes it needs directly (`new MongoService(config.mongo)`) and runs. The
`packages/*` service classes are written as plain classes for exactly this reason — see
`packages/database/README.md` and `packages/auth/README.md` for the framework-boundary details.

## Running it

```bash
pnpm install

docker compose up -d postgres mongo redis kafka clickhouse   # from the repo root
pnpm migration:run       # applies schema + seeds roles/permissions/device types
pnpm seed:demo             # optional: demo tenant + admin/user accounts, prints credentials

pnpm dev:api                # REST API   -> http://localhost:8001  (/api/health, /api/docs)
pnpm dev:websocket            # WebSocket  -> ws://localhost:8002   (see apps/websocket/asyncapi.yaml)
pnpm dev:ingestion-worker
pnpm dev:cron-worker
```

Production build/run (mirrors what `Dockerfile`'s four targets do):

```bash
pnpm build                  # builds all four apps into dist/apps/*
pnpm start:api
pnpm start:websocket
pnpm start:ingestion-worker
pnpm start:cron-worker
```

`pnpm typecheck` runs `tsc --noEmit` across all four apps (each has its own `tsconfig`, but they
all resolve `@app/database`, `@app/auth`, `@app/common` the same way via the root `tsconfig.json`'s
path aliases).

## Database migrations

Postgres schema changes are TypeORM migrations under `packages/database/postgres/migrations/` —
`synchronize` is never `true`. `apps/api` runs them explicitly at boot
(`dataSource.runMigrations()`, not the implicit `migrationsRun` option) so a failure produces a
clear log line and a controlled exit rather than an opaque rejected bootstrap promise. See
`packages/database/README.md` for the day-to-day "add a migration" workflow.

ClickHouse has its own lightweight migration mechanism (no TypeORM driver exists for it) — also
run from `apps/api` at boot, see the same README.

## Env

`.env` / `.env.example` are sectioned by the role each database plays, not just by product name:
**Application** (port, CORS), **Auth** (JWT), **Application data** (PostgreSQL — the system of
record), **Document database** (MongoDB — the metrics event stream), **Cache** (Redis — wired but
no longer used by the metrics pipeline, see below), **Event stream** (Kafka — the live transport
between `apps/websocket` and its consumers that replaced Redis for this), **Analytics** (ClickHouse
— infra-only for now). Every database uses discrete `HOST`/`PORT`/`USER`/`PASSWORD`/`DB`/`SSL`
fields (Postgres also gets `SCHEMA`; Kafka gets `BROKERS`/`CLIENT_ID`/`SSL` instead since it's a
broker, not a single host) — no shared connection strings. All of it is validated with Joi at
process startup (`packages/common/config/configuration.ts`); a missing or invalid var fails fast
with a clear error instead of a partial boot.

## Docker

`Dockerfile` is multi-stage with one final target per app (`api`, `websocket`,
`ingestion-worker`, `cron-worker`), all built from the same `pnpm build` output and the same
root `package.json`/lockfile — see the file's top comment for the deliberate trade-off that
implies (every image carries the full dependency set). The root `docker-compose.yml` runs one
service per target plus `postgres`/`mongo`/`redis`/`kafka`/`clickhouse`, each service's
`depends_on` narrowed to the databases it actually talks to.
