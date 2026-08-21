import { CpuCollector } from './cpu.collector'
import { DiskCollector } from './disk.collector'
import { LoadAverageCollector } from './load-average.collector'
import { MemoryCollector } from './memory.collector'
import { NetworkCollector } from './network.collector'
import { OsInfoCollector } from './os-info.collector'
import type { SystemMetricsCollectors } from './system-metrics.service'
import { UptimeCollector } from './uptime.collector'

export function createSystemMetricsCollectors(): SystemMetricsCollectors {
  return {
    cpu: new CpuCollector(),
    memory: new MemoryCollector(),
    disk: new DiskCollector(),
    loadAverage: new LoadAverageCollector(),
    uptime: new UptimeCollector(),
    osInfo: new OsInfoCollector(),
    network: new NetworkCollector()
  }
}
