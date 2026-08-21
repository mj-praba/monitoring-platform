export const IPC_CHANNELS = {
  METRICS_UPDATE: 'metrics:update',
  METRICS_SNAPSHOT_REQUEST: 'metrics:snapshot-request'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
