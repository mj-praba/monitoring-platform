# apps/workers/ingestion-worker

Plain TypeScript. The durability half of the availability/consistency split: subscribes to the
same Redis channels `apps/websocket` publishes device metrics to
(`psubscribe("device:*:metrics")`, via `DEVICE_METRICS_CHANNEL_PATTERN` from
`@app/database/redis/redis.service`) and writes each message into MongoDB's `device_metrics`
collection.

This is the write that used to happen inline inside the old single-process WebSocket handler.
Moving it here means a dashboard's live view never blocks on, or fails because of, a MongoDB
write — ingestion happens asynchronously and independently, on its own process, with its own
failure domain (a Mongo outage here doesn't take down `apps/websocket`).

An unparseable message is logged and dropped, not retried — there's no dead-letter handling in
this pass. A failed Mongo insert is logged and the message is dropped (Redis pub/sub isn't a
durable queue — there's nothing to redeliver from once a `pmessage` event has fired).

## Running

From `backend/`: `pnpm dev:ingestion-worker` or `pnpm build:ingestion-worker && pnpm
start:ingestion-worker`. No HTTP port — this process only consumes.
