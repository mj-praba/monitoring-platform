import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { AppConfig } from "../config/configuration";

export function deviceChannel(deviceId: string): string {
  return `device:${deviceId}:metrics`;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly publisher: Redis;
  private readonly url: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.url = this.config.get("redisUrl");
    this.publisher = new Redis(this.url);
  }

  async publish(channel: string, payload: string): Promise<void> {
    await this.publisher.publish(channel, payload);
  }

  // Subscribing puts a Redis connection into a dedicated subscribe-only mode,
  // so each dashboard WebSocket gets its own connection - mirrors calling
  // `redis_client.pubsub()` per connection on the Python side.
  createSubscriber(): Redis {
    return new Redis(this.url);
  }

  async onModuleDestroy() {
    await this.publisher.quit();
  }
}
