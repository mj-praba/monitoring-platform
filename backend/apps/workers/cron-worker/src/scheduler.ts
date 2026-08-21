import { Logger } from "winston";

// Fixed-interval scheduler — no cron-expression parsing, both jobs in
// this app run on a plain "every N ms" cadence, so a cron parser dependency
// would be unneeded weight. Runs once immediately, then every intervalMs.
export function runEvery(intervalMs: number, fn: () => Promise<void>, logger: Logger, name: string): NodeJS.Timeout {
  const tick = async () => {
    try {
      await fn();
    } catch (error) {
      logger.error(`Job "${name}" failed`, error as Error);
    }
  };

  void tick();
  return setInterval(tick, intervalMs);
}
