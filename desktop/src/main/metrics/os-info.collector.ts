import os from 'node:os'
import type { OsInfoMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export class OsInfoCollector implements MetricCollector<OsInfoMetrics> {
  async collect(): Promise<OsInfoMetrics> {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      username: this.resolveUsername(),
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron ?? 'unknown',
      chromeVersion: process.versions.chrome ?? 'unknown'
    }
  }

  private resolveUsername(): string {
    try {
      return os.userInfo().username
    } catch {
      return process.env.USER ?? process.env.LOGNAME ?? 'unknown'
    }
  }
}
