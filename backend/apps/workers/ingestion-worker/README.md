# apps/workers/ingestion-worker

Plain TypeScript. The durability half of the availability/consistency split: consumes the same
Kafka topic `apps/websocket` publishes device metrics to (`DEVICE_METRICS_TOPIC` =
`"device-metrics"`, from `@app/database/kafka/kafka.service`), in its own `"ingestion-worker"`
consumer group, and writes each message into MongoDB's `device_metrics` collection.

This is the write that used to happen inline inside the old single-process WebSocket handler.
Moving it here means a dashboard's live view never blocks on, or fails because of, a MongoDB
write — ingestion happens asynchronously and independently, on its own process, with its own
failure domain (a Mongo outage here doesn't take down `apps/websocket`).

An unparseable message is logged and dropped, not retried — there's no dead-letter handling in
this pass. A failed Mongo insert is logged and the message is dropped without retry, matching the
behavior this worker already had under Redis pub/sub. Unlike Redis, Kafka *does* retain the
message on the broker until this consumer's offset commits — a future retry/DLQ strategy is
possible without a transport change — but this pass deliberately keeps behavior identical rather
than adding that now.

## Running

From `backend/`: `pnpm dev:ingestion-worker` or `pnpm build:ingestion-worker && pnpm
start:ingestion-worker`. No HTTP port — this process only consumes.
