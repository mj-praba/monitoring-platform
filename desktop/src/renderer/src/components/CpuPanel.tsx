import type { CpuMetrics } from '../../../shared/types/metrics.types'
import { formatPercent } from '../utils/format'
import { MetricCard } from './MetricCard'

export interface CpuPanelProps {
  cpu: CpuMetrics
}

export function CpuPanel({ cpu }: CpuPanelProps): JSX.Element {
  return (
    <MetricCard title="CPU">
      <p className="metric-card__headline">
        {formatPercent(cpu.usagePercent)}
        <span className="metric-card__subtext"> · {cpu.coreCount} cores · {cpu.speedMHz} MHz</span>
      </p>
      <p className="metric-card__caption">{cpu.model}</p>
      <ul className="core-list">
        {cpu.perCore.map((core) => (
          <li key={core.core} className="core-list__item">
            <span className="core-list__label">core {core.core}</span>
            <span className="core-list__bar">
              <span
                className="core-list__bar-fill"
                style={{ width: `${core.usagePercent ?? 0}%` }}
              />
            </span>
            <span className="core-list__value">{formatPercent(core.usagePercent)}</span>
          </li>
        ))}
      </ul>
    </MetricCard>
  )
}
