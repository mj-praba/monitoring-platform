import os from 'node:os'
import type { UptimeMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export class UptimeCollector implements MetricCollector<UptimeMetrics> {
  constructor(
    private readonly systemUptime: () => number = os.uptime,
    private readonly processUptime: () => number = process.uptime
  ) {}

  async collect(): Promise<UptimeMetrics> {
    return {
      systemUptimeSeconds: this.systemUptime(),
      processUptimeSeconds: this.processUptime()
    }
  }
}
