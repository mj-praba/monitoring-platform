import type {
  CpuMetrics,
  DiskMetrics,
  LoadAverageMetrics,
  MemoryMetrics,
  NetworkMetrics,
  OsInfoMetrics,
  SystemMetrics,
  UptimeMetrics
} from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export interface SystemMetricsCollectors {
  cpu: MetricCollector<CpuMetrics>
  memory: MetricCollector<MemoryMetrics>
  disk: MetricCollector<DiskMetrics>
  loadAverage: MetricCollector<LoadAverageMetrics>
  uptime: MetricCollector<UptimeMetrics>
  osInfo: MetricCollector<OsInfoMetrics>
  network: MetricCollector<NetworkMetrics>
}

export class SystemMetricsService {
  constructor(private readonly collectors: SystemMetricsCollectors) {}

  async collectAll(): Promise<SystemMetrics> {
    const [cpu, memory, disk, loadAverage, uptime, osInfo, network] = await Promise.all([
      this.collectors.cpu.collect(),
      this.collectors.memory.collect(),
      this.collectors.disk.collect(),
      this.collectors.loadAverage.collect(),
      this.collectors.uptime.collect(),
      this.collectors.osInfo.collect(),
      this.collectors.network.collect()
    ])

    return { timestamp: Date.now(), cpu, memory, disk, loadAverage, uptime, osInfo, network }
  }
}
