# apps/workers/cron-worker

Plain TypeScript. A minimal hand-rolled `runEvery(intervalMs, fn)` scheduler (`scheduler.ts`) —
no cron-expression parser, since both jobs below run on a fixed "every 60s" cadence and a full
cron parser would be unneeded weight for that.

## Jobs (`jobs/`)

- `expire-pairing-sessions.job.ts` — marks `pending` pairing sessions `expired` once past their
  `expiresAt`. Proactive version of logic that otherwise only ran lazily, inside
  `apps/api`'s `devices.service.ts`, when someone happened to try claiming an already-expired
  code.
- `mark-stale-devices-offline.job.ts` — marks a device `offline` if `lastSeenAt` is older than
  `DEVICE_OFFLINE_THRESHOLD_MS` (`@app/common/constants/device.constant`, currently 2 minutes).
  Belt-and-suspenders alongside `apps/websocket`'s `ws.on("close")` handler, which already marks
  a device offline immediately on a graceful disconnect — this job catches the case a device
  drops off the network without the socket ever firing `close` (crash, connectivity loss, killed
  process).

Adding a job: write a `(dataSource: DataSource) => Promise<void>` function in `jobs/`, wire it up
in `main.ts` with `runEvery(...)`. A thrown error inside a job is caught and logged by the
scheduler — it doesn't crash the process or stop the next tick.

## Running

From `backend/`: `pnpm dev:cron-worker` or `pnpm build:cron-worker && pnpm start:cron-worker`.
No HTTP port.
