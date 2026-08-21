import type { LoadAverageMetrics } from '../../../shared/types/metrics.types'
import { MetricCard } from './MetricCard'

export interface LoadAveragePanelProps {
  loadAverage: LoadAverageMetrics
}

export function LoadAveragePanel({ loadAverage }: LoadAveragePanelProps): JSX.Element {
  return (
    <MetricCard title="Load average">
      <dl className="metric-list">
        <div className="metric-list__row">
          <dt>1 min</dt>
          <dd>{loadAverage.oneMinute.toFixed(2)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>5 min</dt>
          <dd>{loadAverage.fiveMinute.toFixed(2)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>15 min</dt>
          <dd>{loadAverage.fifteenMinute.toFixed(2)}</dd>
        </div>
      </dl>
    </MetricCard>
  )
}
