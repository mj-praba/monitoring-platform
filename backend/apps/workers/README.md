# apps/workers

Two independent, unrelated background processes. They share nothing except the deployment
convention (plain TypeScript, no HTTP port, one `main.ts` each) — there's no `workers`-level
code, just a directory grouping.

- **[ingestion-worker/](ingestion-worker/README.md)** — subscribes to Redis and persists every
  device metrics sample into MongoDB. The durability half of the availability/consistency split
  described in the root README.
- **[cron-worker/](cron-worker/README.md)** — a minimal hand-rolled interval scheduler running two
  housekeeping jobs: expiring stale pairing sessions and marking unresponsive devices offline.

Neither talks to the other, and neither is on the request path of `apps/api` or
`apps/websocket` — both can be stopped without breaking live pairing, auth, or dashboard
streaming; you'd just stop getting persisted metrics history / housekeeping.

## Running

From `backend/`: `pnpm dev:ingestion-worker` / `pnpm dev:cron-worker`, or
`pnpm build:<name> && pnpm start:<name>`. See each subdirectory's `README.md` for what it does
and why.
