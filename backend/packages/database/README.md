# @app/database

One sub-module per database in the stack, each owning its own config wiring, and (for Postgres and
ClickHouse) its own migrations. `database.module.ts` is the single `@Global()` Nest aggregator —
imported only by `apps/api`.

## Layout

- `postgres/` — **Application data**: tenants, workspaces, locations, roles, permissions, users,
  refresh tokens, devices, pairing sessions. The system of record. `synchronize` is never `true` — schema
  changes only happen via migrations in `postgres/migrations/`.
- `mongo/` — **Document database**: durable store for raw `device_metrics` documents written by
  `apps/workers/ingestion-worker`. Schema-flexible by design.
- `redis/` — **Cache / pub-sub**: the live transport between `apps/websocket` (publisher) and
  `apps/workers/ingestion-worker` (subscriber). Not durable storage.
- `clickhouse/` — **Analytics**: infra-only for now — connection + migration mechanism wired up, no
  application data written yet.

## Framework boundary

Every `*.service.ts` here is a **plain class** taking a plain config object (`PostgresConfig`,
`MongoConfig`, etc., from `@app/common/types/database-config.types`) — no `@Injectable()`, no Nest
lifecycle hooks. `apps/websocket` and `apps/workers/*` `new` these directly. Each folder's `module.ts`
is a thin Nest wrapper (factory provider) used only by `apps/api` — don't add Nest decorators to the
service classes themselves, that would break the plain-TS apps' ability to use them directly.

## Postgres: adding a migration

```bash
# 1. edit/add an entity under postgres/entities/, add it to entities/index.ts's ALL_ENTITIES
# 2. bring up a local postgres (docker compose up -d postgres) and generate the diff:
pnpm migration:generate packages/database/postgres/migrations/DescribeYourChange
# 3. add the generated class to postgres/migrations/index.ts's MIGRATIONS array (by hand —
#    it's an explicit list, not a glob, so it resolves identically under ts-node and every
#    app's compiled dist)
pnpm migration:run
```

`apps/api`'s `main.ts` calls `dataSource.runMigrations()` explicitly at boot (not the implicit
`migrationsRun: true` option) so a failed migration produces a clear log line and a controlled exit
instead of an opaque rejected promise from Nest's bootstrap.

**`user_role_assignments.scope_id` is intentionally polymorphic** — it points at `tenants.id`,
`workspaces.id`, or `locations.id` depending on `scope_type`, rather than three nullable FK columns or a
table per scope type. This is validated in application code (wherever an assignment is created), not a
DB-level constraint. Known trade-off of the initial pass — see the top-level plan doc for the reasoning.

## ClickHouse: adding a migration

Add a new `packages/database/clickhouse/migrations/NNNN_description.sql` file — **one SQL statement per
file** (the runner has no statement splitter), sequence number prefix determines apply order. No index
file to update; `runClickHouseMigrations` reads the directory itself and tracks what's applied in a
`schema_migrations` table inside ClickHouse.

## How to use a service

```ts
// apps/api (Nest) — via DI, already connected by the module's factory provider
constructor(private readonly mongo: MongoService) {}

// apps/websocket / apps/workers/* (plain TS)
const redis = new RedisService(config.redis);
const subscriber = redis.createSubscriber();
```
