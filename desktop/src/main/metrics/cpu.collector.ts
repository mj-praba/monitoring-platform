import os from 'node:os'
import type { CpuMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export class CpuCollector implements MetricCollector<CpuMetrics> {
  private previous: os.CpuInfo[] | null = null

  constructor(private readonly readCpus: () => os.CpuInfo[] = os.cpus) {}

  async collect(): Promise<CpuMetrics> {
    const current = this.readCpus()
    const previous = this.previous
    this.previous = current

    const sampleCount = previous ? Math.min(previous.length, current.length) : current.length
    const perCore = current.slice(0, sampleCount).map((core, index) => ({
      core: index,
      usagePercent: previous ? this.usageFrom(previous[index], core) : null
    }))

    const numeric = perCore
      .map((c) => c.usagePercent)
      .filter((value): value is number => value !== null)
    const usagePercent = numeric.length
      ? Math.round((numeric.reduce((sum, value) => sum + value, 0) / numeric.length) * 100) / 100
      : null

    return {
      model: current[0]?.model ?? 'unknown',
      speedMHz: current[0]?.speed ?? 0,
      coreCount: current.length,
      usagePercent,
      perCore
    }
  }

  private usageFrom(previous: os.CpuInfo, current: os.CpuInfo): number {
    const totalDelta = CpuCollector.sum(current.times) - CpuCollector.sum(previous.times)
    if (totalDelta <= 0) return 0
    const idleDelta = current.times.idle - previous.times.idle
    return Math.round(((totalDelta - idleDelta) / totalDelta) * 10000) / 100
  }

  private static sum(times: os.CpuInfo['times']): number {
    return times.user + times.nice + times.sys + times.idle + times.irq
  }
}
