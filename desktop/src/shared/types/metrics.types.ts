export interface CpuCoreUsage {
  core: number
  usagePercent: number | null
}

export interface CpuMetrics {
  model: string
  speedMHz: number
  coreCount: number
  usagePercent: number | null
  perCore: CpuCoreUsage[]
}

export interface MemoryMetrics {
  totalBytes: number
  freeBytes: number
  availableBytes: number
  bufferedBytes: number
  cachedBytes: number
  usedBytes: number
  usedPercent: number
  swapTotalBytes: number
  swapFreeBytes: number
  swapUsedBytes: number
}

export interface DiskMetrics {
  path: string
  totalBytes: number
  freeBytes: number
  availableBytes: number
  usedBytes: number
  usedPercent: number
}

export interface LoadAverageMetrics {
  oneMinute: number
  fiveMinute: number
  fifteenMinute: number
}

export interface UptimeMetrics {
  systemUptimeSeconds: number
  processUptimeSeconds: number
}

export interface OsInfoMetrics {
  hostname: string
  platform: NodeJS.Platform
  arch: string
  release: string
  type: string
  username: string
  nodeVersion: string
  electronVersion: string
  chromeVersion: string
}

export interface NetworkInterfaceInfo {
  name: string
  address: string
  family: string
  mac: string
  internal: boolean
}

export interface NetworkMetrics {
  interfaces: NetworkInterfaceInfo[]
}

export interface SystemMetrics {
  timestamp: number
  cpu: CpuMetrics
  memory: MemoryMetrics
  disk: DiskMetrics
  loadAverage: LoadAverageMetrics
  uptime: UptimeMetrics
  osInfo: OsInfoMetrics
  network: NetworkMetrics
}
