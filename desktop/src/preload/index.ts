import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { SystemMetrics } from '../shared/types/metrics.types'
import type { MetricsApi } from '../shared/types/ipc.types'

const metricsApi: MetricsApi = {
  getSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.METRICS_SNAPSHOT_REQUEST),
  onUpdate: (callback) => {
    const listener = (_event: IpcRendererEvent, metrics: SystemMetrics): void => callback(metrics)
    ipcRenderer.on(IPC_CHANNELS.METRICS_UPDATE, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.METRICS_UPDATE, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('metricsApi', metricsApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error fallback only relevant if contextIsolation is ever disabled
  window.metricsApi = metricsApi
}
