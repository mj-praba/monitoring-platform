import type { MetricsApi } from '../../shared/types/ipc.types'

declare global {
  interface Window {
    metricsApi: MetricsApi
  }
}

export {}
