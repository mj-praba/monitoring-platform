import { useEffect, useState } from 'react'
import type { SystemMetrics } from '../../../shared/types/metrics.types'

export interface UseSystemMetricsResult {
  metrics: SystemMetrics | null
  isLoading: boolean
  error: Error | null
}

export function useSystemMetrics(): UseSystemMetricsResult {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    window.metricsApi
      .getSnapshot()
      .then((snapshot) => {
        if (!cancelled) setMetrics(snapshot)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught : new Error(String(caught)))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    const unsubscribe = window.metricsApi.onUpdate((snapshot) => {
      if (!cancelled) setMetrics(snapshot)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { metrics, isLoading, error }
}
