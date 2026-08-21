import { promises as fsPromises } from 'node:fs'
import type { DiskMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export class DiskCollector implements MetricCollector<DiskMetrics> {
  constructor(
    private readonly statfs: typeof fsPromises.statfs = fsPromises.statfs,
    private readonly targetPath: string = '/'
  ) {}

  async collect(): Promise<DiskMetrics> {
    try {
      const stats = await this.statfs(this.targetPath)
      const totalBytes = stats.blocks * stats.bsize
      const freeBytes = stats.bfree * stats.bsize
      const availableBytes = stats.bavail * stats.bsize
      const usedBytes = totalBytes - freeBytes

      return {
        path: this.targetPath,
        totalBytes,
        freeBytes,
        availableBytes,
        usedBytes,
        usedPercent: totalBytes ? Math.round((usedBytes / totalBytes) * 10000) / 100 : 0
      }
    } catch {
      return {
        path: this.targetPath,
        totalBytes: 0,
        freeBytes: 0,
        availableBytes: 0,
        usedBytes: 0,
        usedPercent: 0
      }
    }
  }
}
