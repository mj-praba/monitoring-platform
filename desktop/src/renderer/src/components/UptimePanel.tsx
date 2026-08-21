import type { UptimeMetrics } from '../../../shared/types/metrics.types'
import { formatDuration } from '../utils/format'
import { MetricCard } from './MetricCard'

export interface UptimePanelProps {
  uptime: UptimeMetrics
}

export function UptimePanel({ uptime }: UptimePanelProps): JSX.Element {
  return (
    <MetricCard title="Uptime">
      <dl className="metric-list">
        <div className="metric-list__row">
          <dt>System</dt>
          <dd>{formatDuration(uptime.systemUptimeSeconds)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>This app</dt>
          <dd>{formatDuration(uptime.processUptimeSeconds)}</dd>
        </div>
      </dl>
    </MetricCard>
  )
}
