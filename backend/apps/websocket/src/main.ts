import "dotenv/config";
import { createServer } from "http";
import { DataSource } from "typeorm";
import { TokenService } from "@app/auth/token.service";
import { loadAppConfig } from "@app/common/config/configuration";
import { createLogger } from "@app/common/logger/logger";
import { buildPostgresDataSourceOptions } from "@app/database/postgres/options";
import { RedisService } from "@app/database/redis/redis.service";
import { attachWebSocketServer } from "./ws/ws.server";

const logger = createLogger("websocket");

async function bootstrap() {
  const config = loadAppConfig();

  // Read-only in practice (only ever .findOneBy / permission-check
  // queries + the device status/lastSeenAt update on connect/message/
  // close) — this app never runs migrations, that's apps/api's job.
  const dataSource = new DataSource(buildPostgresDataSourceOptions(config.postgres));
  await dataSource.initialize();
  logger.info("Connected to Postgres");

  const redisService = new RedisService(config.redis);
  const tokenService = new TokenService(config.auth.jwtSecret);

  const server = createServer();
  attachWebSocketServer(server, { dataSource, tokenService, redisService });

  server.listen(config.wsPort, () => {
    logger.info(`monitoring-platform websocket listening on port ${config.wsPort}`);
  });

  const shutdown = async () => {
    await Promise.allSettled([redisService.disconnect(), dataSource.destroy()]);
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  logger.error("Failed to start websocket app", error);
  process.exit(1);
});
