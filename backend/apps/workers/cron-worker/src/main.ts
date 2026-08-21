import "dotenv/config";
import { DataSource } from "typeorm";
import { loadAppConfig } from "@app/common/config/configuration";
import { createLogger } from "@app/common/logger/logger";
import { buildPostgresDataSourceOptions } from "@app/database/postgres/options";
import { expirePairingSessions } from "./jobs/expire-pairing-sessions.job";
import { markStaleDevicesOffline } from "./jobs/mark-stale-devices-offline.job";
import { runEvery } from "./scheduler";

const logger = createLogger("cron-worker");
const ONE_MINUTE_MS = 60 * 1000;

async function bootstrap() {
  const config = loadAppConfig();

  const dataSource = new DataSource(buildPostgresDataSourceOptions(config.postgres));
  await dataSource.initialize();
  logger.info("Connected to Postgres");

  const timers = [
    runEvery(ONE_MINUTE_MS, () => expirePairingSessions(dataSource), logger, "expire-pairing-sessions"),
    runEvery(ONE_MINUTE_MS, () => markStaleDevicesOffline(dataSource), logger, "mark-stale-devices-offline"),
  ];
  logger.info("cron-worker running: expire-pairing-sessions, mark-stale-devices-offline (every 60s)");

  const shutdown = async () => {
    timers.forEach(clearInterval);
    await dataSource.destroy();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  logger.error("Failed to start cron worker", error);
  process.exit(1);
});
