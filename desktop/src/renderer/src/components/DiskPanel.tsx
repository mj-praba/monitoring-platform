import type { DiskMetrics } from '../../../shared/types/metrics.types'
import { formatBytes } from '../utils/format'
import { MetricCard } from './MetricCard'

export interface DiskPanelProps {
  disk: DiskMetrics
}

export function DiskPanel({ disk }: DiskPanelProps): JSX.Element {
  return (
    <MetricCard title="Disk">
      <p className="metric-card__headline">
        {disk.usedPercent.toFixed(1)}%
        <span className="metric-card__subtext">
          {' '}
          · {formatBytes(disk.usedBytes)} / {formatBytes(disk.totalBytes)}
        </span>
      </p>
      <p className="metric-card__caption">{disk.path}</p>
      <dl className="metric-list">
        <div className="metric-list__row">
          <dt>Free</dt>
          <dd>{formatBytes(disk.freeBytes)}</dd>
        </div>
        <div className="metric-list__row">
          <dt>Available</dt>
          <dd>{formatBytes(disk.availableBytes)}</dd>
        </div>
      </dl>
    </MetricCard>
  )
}
