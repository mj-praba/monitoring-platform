import "dotenv/config";
import { loadAppConfig } from "@app/common/config/configuration";
import { createLogger } from "@app/common/logger/logger";
import { DEVICE_METRICS_TOPIC, KafkaService } from "@app/database/kafka/kafka.service";
import { MongoService } from "@app/database/mongo/mongo.service";

const logger = createLogger("ingestion-worker");

// The real decoupling in the availability/consistency split: apps/websocket
// publishes to Kafka and never waits on a database write. This worker
// consumes the same topic, in its own consumer group, and persists each
// message into MongoDB durably and independently, so a slow/failed Mongo
// write can never delay live delivery to a connected dashboard.
async function bootstrap() {
  const config = loadAppConfig();

  const mongoService = new MongoService(config.mongo);
  await mongoService.connect();
  logger.info("Connected to MongoDB");

  const kafkaService = new KafkaService(config.kafka);
  await kafkaService.connect();
  await kafkaService.ensureTopic(DEVICE_METRICS_TOPIC, 6);

  // One shared group name: if this worker is ever horizontally scaled, Kafka
  // load-balances the topic's partitions across group members, so each
  // message is still persisted exactly once — the opposite semantics from
  // apps/websocket's per-instance dashboard-fanout groups, which want every
  // instance to see everything.
  const consumer = await kafkaService.createConsumer("ingestion-worker", DEVICE_METRICS_TOPIC);
  logger.info(`Subscribed to ${DEVICE_METRICS_TOPIC}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      void ingest(mongoService, message.value.toString());
    },
  });

  const shutdown = async () => {
    await Promise.allSettled([kafkaService.disconnect(), mongoService.disconnect()]);
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

async function ingest(mongoService: MongoService, raw: string): Promise<void> {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    logger.warn("Dropped unparseable metrics message");
    return;
  }

  try {
    await mongoService.deviceMetricsCollection().insertOne(payload as Record<string, unknown>);
  } catch (error) {
    logger.error("Failed to persist device metrics", error as Error);
  }
}

bootstrap().catch((error) => {
  logger.error("Failed to start ingestion worker", error);
  process.exit(1);
});
