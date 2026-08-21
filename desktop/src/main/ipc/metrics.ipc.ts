import { ipcMain, type BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { SystemMetrics } from '../../shared/types/metrics.types'
import { createSystemMetricsCollectors } from '../metrics/collectors.factory'
import { MetricsPoller } from '../metrics/metrics-poller'
import { SystemMetricsService } from '../metrics/system-metrics.service'

const POLL_INTERVAL_MS = 2000

export function registerMetricsIpc(mainWindow: BrowserWindow): () => void {
  // Constructed once: the poller ticks and the one-off snapshot request below must
  // share the same CpuCollector instance, otherwise their delta baselines diverge.
  const service = new SystemMetricsService(createSystemMetricsCollectors())
  const poller = new MetricsPoller<SystemMetrics>(() => service.collectAll(), POLL_INTERVAL_MS)

  const unsubscribe = poller.subscribe((snapshot) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.METRICS_UPDATE, snapshot)
    }
  })

  ipcMain.handle(IPC_CHANNELS.METRICS_SNAPSHOT_REQUEST, () => service.collectAll())
  poller.start()

  return () => {
    poller.stop()
    unsubscribe()
    ipcMain.removeHandler(IPC_CHANNELS.METRICS_SNAPSHOT_REQUEST)
  }
}
