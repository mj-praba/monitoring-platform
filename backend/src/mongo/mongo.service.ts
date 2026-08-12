import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Collection, Db, MongoClient } from "mongodb";
import { AppConfig } from "../config/configuration";

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.client = new MongoClient(this.config.get("mongoUrl"));
    this.db = this.client.db(this.config.get("mongoDbName"));
  }

  async onModuleInit() {
    await this.client.connect();
    await this.db.command({ ping: 1 });
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  deviceMetricsCollection(): Collection {
    return this.db.collection("device_metrics");
  }
}
