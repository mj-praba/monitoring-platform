import type { SystemMetrics } from './metrics.types'

export interface MetricsApi {
  getSnapshot: () => Promise<SystemMetrics>
  onUpdate: (callback: (metrics: SystemMetrics) => void) => () => void
}
