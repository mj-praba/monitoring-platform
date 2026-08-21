import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ClickHouseConfig } from "@app/common/types/database-config.types";

// Plain class — see mongo.service.ts for the framework-boundary rationale.
// The client takes a full http(s)://host:port URL plus discrete
// username/password/database, so only scheme+host+port is composed here.
export class ClickHouseService {
  private readonly client: ClickHouseClient;

  constructor(cfg: ClickHouseConfig) {
    this.client = createClient({
      url: `${cfg.ssl ? "https" : "http"}://${cfg.host}:${cfg.port}`,
      username: cfg.username,
      password: cfg.password,
      database: cfg.database,
    });
  }

  getClient(): ClickHouseClient {
    return this.client;
  }

  async connect(): Promise<void> {
    const result = await this.client.ping();
    if (!result.success) {
      throw new Error("ClickHouse ping failed");
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }
}
