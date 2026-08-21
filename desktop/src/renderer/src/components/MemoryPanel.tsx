import type { MemoryMetrics } from '../../../shared/types/metrics.types'
import { formatBytes } from '../utils/format'
import { MetricCard } from './MetricCard'

export interface MemoryPanelProps {
  memory: MemoryMetrics
}

export function MemoryPanel({ memory }: MemoryPanelProps): JSX.Element {
  return (
    <MetricCard title="Memory">
      <p className="metric-card__headline">
        {memory.usedPercent.toFixed(1)}%
        <span className="metric-card__subtext">
          {' '}
          · {formatBytes(memory.usedBytes)} / {formatBytes(memory.totalBytes)}
        </span>
      </p>
      <dl className="metric-list">
        <div className="metric-list__row">
          <dt>Available</dt>
          <dd>{formatBytes(memory.availableBytes)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>Buffers</dt>
          <dd>{formatBytes(memory.bufferedBytes)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>Cached</dt>
          <dd>{formatBytes(memory.cachedBytes)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>Swap</dt>
          <dd>
            {formatBytes(memory.swapUsedBytes)} / {formatBytes(memory.swapTotalBytes)}
          </dd>
        </div>
      </dl>
    </MetricCard>
  )
}
