import { Admin, Consumer, Kafka, Producer } from "kafkajs";
import { KafkaConfig } from "@app/common/types/database-config.types";

export const DEVICE_METRICS_TOPIC = "device-metrics";

// Kafka message key for a device's metrics — the Kafka equivalent of
// redis.service.ts's deviceChannel(). Here it drives partition assignment
// (every message for one device lands on the same partition, preserving
// per-device ordering) rather than naming a pub/sub channel.
export function deviceMetricsKey(deviceId: string): string {
  return deviceId;
}

// Plain class — see mongo.service.ts for the framework-boundary rationale.
// Unlike ioredis (lazy-connects, buffers commands automatically), kafkajs's
// producer/consumers require an explicit connect() before use — callers
// await connect() once at boot, same shape as MongoService/ClickHouseService,
// not RedisService's implicit-connect constructor.
export class KafkaService {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumers: Consumer[] = [];

  constructor(cfg: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: cfg.clientId,
      brokers: cfg.brokers,
      ssl: cfg.ssl,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publish(topic: string, key: string, payload: string): Promise<void> {
    await this.producer.send({ topic, messages: [{ key, value: payload }] });
  }

  // Explicit topic creation rather than relying on broker auto-create — same
  // "explicit, fails loud" philosophy as apps/api's dataSource.runMigrations().
  // Idempotent, so both apps/websocket and apps/workers/ingestion-worker can
  // call it at boot regardless of which one starts first.
  async ensureTopic(topic: string, numPartitions: number): Promise<void> {
    const admin: Admin = this.kafka.admin();
    await admin.connect();
    try {
      const existing = await admin.listTopics();
      if (!existing.includes(topic)) {
        await admin.createTopics({ topics: [{ topic, numPartitions, replicationFactor: 1 }] });
      }
    } finally {
      await admin.disconnect();
    }
  }

  // Connects, subscribes, and hands back the raw kafkajs Consumer — the
  // caller attaches its own eachMessage handler via .run(). Tracked here so
  // disconnect() can clean every consumer this service created.
  async createConsumer(groupId: string, topic: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    this.consumers.push(consumer);
    return consumer;
  }

  async disconnect(): Promise<void> {
    await Promise.allSettled([this.producer.disconnect(), ...this.consumers.map((c) => c.disconnect())]);
  }
}
