import { DataSourceOptions } from "typeorm";
import { PostgresConfig } from "@app/common/types/database-config.types";
import { ALL_ENTITIES } from "./entities";
import { MIGRATIONS } from "./migrations";

// Pure function, shared by apps/api's Nest wrapper (postgres.module.ts) and
// the CLI DataSource (data-source.ts) — one place that knows how a
// PostgresConfig turns into TypeORM options. synchronize is not a field
// here on purpose: it is never true anywhere in this codebase, schema
// changes only ever happen via migrations.
export function buildPostgresDataSourceOptions(cfg: PostgresConfig): DataSourceOptions {
  return {
    type: "postgres",
    host: cfg.host,
    port: cfg.port,
    username: cfg.username,
    password: cfg.password,
    database: cfg.database,
    schema: cfg.schema,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
    entities: ALL_ENTITIES,
    migrations: MIGRATIONS,
    synchronize: false,
  };
}
