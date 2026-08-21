import type { NetworkMetrics } from '../../../shared/types/metrics.types'
import { MetricCard } from './MetricCard'

export interface NetworkPanelProps {
  network: NetworkMetrics
}

export function NetworkPanel({ network }: NetworkPanelProps): JSX.Element {
  const externalInterfaces = network.interfaces.filter((iface) => !iface.internal)

  return (
    <MetricCard title="Network interfaces">
      {externalInterfaces.length === 0 ? (
        <p className="metric-card__caption">No external interfaces detected.</p>
      ) : (
        <ul className="network-list">
          {externalInterfaces.map((iface) => (
            <li key={`${iface.name}-${iface.address}`} className="network-list__item">
              <span className="network-list__name">{iface.name}</span>
              <span className="network-list__address">
                {iface.address} ({iface.family})
              </span>
              <span className="network-list__mac">{iface.mac}</span>
            </li>
          ))}
        </ul>
      )}
    </MetricCard>
  )
}
