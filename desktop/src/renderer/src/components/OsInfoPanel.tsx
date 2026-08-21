import type { OsInfoMetrics } from '../../../shared/types/metrics.types'
import { MetricCard } from './MetricCard'

export interface OsInfoPanelProps {
  osInfo: OsInfoMetrics
}

export function OsInfoPanel({ osInfo }: OsInfoPanelProps): JSX.Element {
  return (
    <MetricCard title="System">
      <dl className="metric-list">
        <div className="metric-list__row">
          <dt>Hostname</dt>
          <dd>{osInfo.hostname}</dd>
        </div>
        <div className="metric-list__row">
          <dt>User</dt>
          <dd>{osInfo.username}</dd>
        </div>
        <div className="metric-list__row">
          <dt>Platform</dt>
          <dd>
            {osInfo.type} {osInfo.release} ({osInfo.arch})
          </dd>
        </div>
        <div className="metric-list__row">
          <dt>Runtime</dt>
          <dd>
            Node {osInfo.nodeVersion} · Electron {osInfo.electronVersion} · Chrome{' '}
            {osInfo.chromeVersion}
          </dd>
        </div>
      </dl>
    </MetricCard>
  )
}
