import "dotenv/config";
import { loadAppConfig } from "@app/common/config/configuration";
import { createLogger } from "@app/common/logger/logger";
import { MongoService } from "@app/database/mongo/mongo.service";
import { DEVICE_METRICS_CHANNEL_PATTERN, RedisService } from "@app/database/redis/redis.service";

const logger = createLogger("ingestion-worker");

// The real decoupling in the availability/consistency split: apps/websocket
// publishes to Redis and never waits on a database write. This worker
// subscribes to the same channel(s) and persists each message into
// MongoDB durably and independently, so a slow/failed Mongo write can
// never delay live delivery to a connected dashboard.
async function bootstrap() {
  const config = loadAppConfig();

  const mongoService = new MongoService(config.mongo);
  await mongoService.connect();
  logger.info("Connected to MongoDB");

  const redisService = new RedisService(config.redis);
  const subscriber = redisService.createSubscriber();
  await subscriber.psubscribe(DEVICE_METRICS_CHANNEL_PATTERN);
  logger.info(`Subscribed to ${DEVICE_METRICS_CHANNEL_PATTERN}`);

  subscriber.on("pmessage", (_pattern: string, _channel: string, message: string) => {
    void ingest(mongoService, message);
  });

  const shutdown = async () => {
    subscriber.disconnect();
    await Promise.allSettled([redisService.disconnect(), mongoService.disconnect()]);
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
