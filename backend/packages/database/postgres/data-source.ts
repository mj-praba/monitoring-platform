// CLI-only entrypoint (`pnpm typeorm` / migration:generate / migration:run /
// migration:revert). Nest DI isn't available here, so env loading and
// validation happen the same way the plain-TS apps do it.
import "dotenv/config";
import { DataSource } from "typeorm";
import { loadAppConfig } from "@app/common/config/configuration";
import { buildPostgresDataSourceOptions } from "./options";

const config = loadAppConfig();

export const AppDataSource = new DataSource(buildPostgresDataSourceOptions(config.postgres));
