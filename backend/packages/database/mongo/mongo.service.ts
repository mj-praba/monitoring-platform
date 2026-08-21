import { Collection, Db, MongoClient } from "mongodb";
import { MongoConfig } from "@app/common/types/database-config.types";

// Plain class — no @Injectable(), no Nest lifecycle hooks — so it can be
// `new`'d directly by the plain-TS apps (websocket, ingestion-worker) as
// well as wired into apps/api's DI container via mongo.module.ts's factory
// provider. The driver itself has no discrete host/port/user/password
// constructor, so this composes only scheme+host+port into the connection
// string and passes credentials via MongoClientOptions.auth.
export class MongoService {
  private readonly client: MongoClient;
  private readonly db: Db;

  constructor(cfg: MongoConfig) {
    this.client = new MongoClient(`mongodb://${cfg.host}:${cfg.port}`, {
      auth: cfg.username ? { username: cfg.username, password: cfg.password ?? "" } : undefined,
      tls: cfg.ssl,
    });
    this.db = this.client.db(cfg.database);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.db.command({ ping: 1 });
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  deviceMetricsCollection(): Collection {
    return this.db.collection("device_metrics");
  }
}
