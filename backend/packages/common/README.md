# @app/common

Cross-cutting code with no database or framework opinions of its own: shared types, constants, config
loading, logging, and HTTP error handling. Everything here is safe to import from `apps/api` (NestJS) as
well as the plain-TypeScript apps (`apps/websocket`, `apps/workers/*`) — nothing in this package requires
a DI container, **except** `filters/http-exception.filter.ts` and `logger/logger.module.ts`, which are
thin Nest wrappers and are only ever imported by `apps/api`.

## Layout

- `types/` — shared TypeScript types: `TokenPayload`/`TokenScope` (auth), `PostgresConfig`/`MongoConfig`/
  `RedisConfig`/`ClickHouseConfig` (per-database config shapes), `IAppExceptionOptions`.
- `constants/` — `ROLE_CODES`, `PERMISSION_CODES`, and the `ROLE_PERMISSIONS` map that is the single
  source of truth for which permissions each seeded role carries (read by both the `SeedRolesAndPermissions`
  migration and `demo.seed.ts`); `SCOPE_TYPES` for the tenant/workspace/location hierarchy; `DEVICE_TYPE_CODES`
  and `DEVICE_OFFLINE_THRESHOLD_MS`; `ERROR_CODES`/`ERROR_MESSAGES`.
- `config/configuration.ts` — `loadAppConfig(): AppConfig`. Framework-agnostic: validates `process.env` with
  Joi and throws synchronously on anything missing/invalid. Call it directly as the first line of a plain
  app's `main.ts`; in `apps/api` it's wrapped via `ConfigModule.forRoot({ load: [loadAppConfig] })`.
- `logger/` — `createLogger(context)` (plain winston logger, for the plain-TS apps) and `LoggerModule`
  (Nest wrapper around the same config, for `apps/api`). Both share `logger.config.ts` so every process
  logs in the same shape.
- `filters/http-exception.filter.ts` — Nest global exception filter, `apps/api` only.
- `exceptions/app.exception.ts` — `AppException`, a typed `HttpException` subclass used across `apps/api`.

## How to use it

```ts
// plain app (apps/websocket, apps/workers/*)
import { loadAppConfig } from "@app/common/config/configuration";
import { createLogger } from "@app/common/logger/logger";

const config = loadAppConfig(); // throws immediately if env is invalid
const logger = createLogger("ingestion-worker");
```

```ts
// apps/api (Nest)
ConfigModule.forRoot({ isGlobal: true, load: [loadAppConfig] });
```

Adding a new env-driven setting: extend the Joi schema and the `AppConfig` shape in `config/configuration.ts`
together — the schema is the runtime source of truth, the interface is the compile-time one, and they're
meant to be edited as one unit.
