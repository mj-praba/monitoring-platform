import Redis, { RedisOptions } from "ioredis";
import { RedisConfig } from "@app/common/types/database-config.types";

export function deviceChannel(deviceId: string): string {
  return `device:${deviceId}:metrics`;
}

// Pattern apps/workers/ingestion-worker subscribes to — covers every
// device's channel without needing to know device ids up front.
export const DEVICE_METRICS_CHANNEL_PATTERN = "device:*:metrics";

// Plain class — see mongo.service.ts for the framework-boundary rationale.
// ioredis accepts every field discretely, no connection-string composition
// needed here.
export class RedisService {
  private readonly publisher: Redis;
  private readonly options: RedisOptions;

  constructor(cfg: RedisConfig) {
    this.options = {
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
      db: cfg.db,
      tls: cfg.ssl ? {} : undefined,
    };
    this.publisher = new Redis(this.options);
  }

  async publish(channel: string, payload: string): Promise<void> {
    await this.publisher.publish(channel, payload);
  }

  // Subscribing puts a Redis connection into a dedicated subscribe-only
  // mode, so each caller (dashboard WS connection, ingestion worker) gets
  // its own connection.
  createSubscriber(): Redis {
    return new Redis(this.options);
  }

  async disconnect(): Promise<void> {
    await this.publisher.quit();
  }
}
