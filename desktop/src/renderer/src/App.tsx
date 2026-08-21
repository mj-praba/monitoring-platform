import { CpuPanel } from './components/CpuPanel'
import { DiskPanel } from './components/DiskPanel'
import { LoadAveragePanel } from './components/LoadAveragePanel'
import { MemoryPanel } from './components/MemoryPanel'
import { NetworkPanel } from './components/NetworkPanel'
import { OsInfoPanel } from './components/OsInfoPanel'
import { UptimePanel } from './components/UptimePanel'
import { useSystemMetrics } from './hooks/useSystemMetrics'

export function App(): JSX.Element {
  const { metrics, isLoading, error } = useSystemMetrics()

  if (error) {
    return (
      <main className="app app--message">
        <p>Failed to load system metrics: {error.message}</p>
      </main>
    )
  }

  if (isLoading || !metrics) {
    return (
      <main className="app app--message">
        <p>Loading system metrics…</p>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>System Monitor</h1>
        <p className="app__timestamp">
          Last updated {new Date(metrics.timestamp).toLocaleTimeString()}
        </p>
      </header>
      <div className="app__grid">
        <CpuPanel cpu={metrics.cpu} />
        <MemoryPanel memory={metrics.memory} />
        <DiskPanel disk={metrics.disk} />
        <LoadAveragePanel loadAverage={metrics.loadAverage} />
        <UptimePanel uptime={metrics.uptime} />
        <OsInfoPanel osInfo={metrics.osInfo} />
        <NetworkPanel network={metrics.network} />
      </div>
    </main>
  )
}
