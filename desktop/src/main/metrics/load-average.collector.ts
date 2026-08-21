import os from 'node:os'
import type { LoadAverageMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export class LoadAverageCollector implements MetricCollector<LoadAverageMetrics> {
  constructor(private readonly loadavg: () => number[] = os.loadavg) {}

  async collect(): Promise<LoadAverageMetrics> {
    const [oneMinute, fiveMinute, fifteenMinute] = this.loadavg()
    return { oneMinute, fiveMinute, fifteenMinute }
  }
}
