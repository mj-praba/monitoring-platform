import "dotenv/config";
import { randomUUID } from "crypto";
import { createServer } from "http";
import { DataSource } from "typeorm";
import { TokenService } from "@app/auth/token.service";
import { loadAppConfig } from "@app/common/config/configuration";
import { createLogger } from "@app/common/logger/logger";
import { DEVICE_METRICS_TOPIC, KafkaService } from "@app/database/kafka/kafka.service";
import { buildPostgresDataSourceOptions } from "@app/database/postgres/options";
import { DashboardRegistry } from "./ws/dashboard-registry";
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

  const kafkaService = new KafkaService(config.kafka);
  await kafkaService.connect();
  await kafkaService.ensureTopic(DEVICE_METRICS_TOPIC, 6);

  const dashboardRegistry = new DashboardRegistry();

  // Own consumer group per process instance: every horizontally-scaled
  // apps/websocket instance gets a full copy of the topic (not a shard of
  // it), since each instance doesn't know in advance which dashboard
  // connects to it. Compare apps/workers/ingestion-worker's single shared
  // "ingestion-worker" group, which shards the topic for exactly-once
  // persistence instead.
  const instanceId = randomUUID();
  const dashboardConsumer = await kafkaService.createConsumer(
    `websocket-dashboard-fanout-${instanceId}`,
    DEVICE_METRICS_TOPIC,
  );
  await dashboardConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.key || !message.value) return;
      dashboardRegistry.dispatch(message.key.toString(), message.value.toString());
    },
  });

  const tokenService = new TokenService(config.auth.jwtSecret);

  const server = createServer();
  attachWebSocketServer(server, { dataSource, tokenService, kafkaService, dashboardRegistry });

  server.listen(config.wsPort, () => {
    logger.info(`monitoring-platform websocket listening on port ${config.wsPort}`);
  });

  const shutdown = async () => {
    await Promise.allSettled([kafkaService.disconnect(), dataSource.destroy()]);
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  logger.error("Failed to start websocket app", error);
  process.exit(1);
});
