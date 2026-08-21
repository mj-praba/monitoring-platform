import os from 'node:os'
import { promises as fsPromises } from 'node:fs'
import type { MemoryMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

const MEMINFO_PATH = '/proc/meminfo'
const MEMINFO_LINE = /^(\w+):\s+(\d+)\s*kB$/

export class MemoryCollector implements MetricCollector<MemoryMetrics> {
  constructor(
    private readonly platform: () => NodeJS.Platform = os.platform,
    private readonly readFile: typeof fsPromises.readFile = fsPromises.readFile,
    private readonly totalmem: () => number = os.totalmem,
    private readonly freemem: () => number = os.freemem
  ) {}

  async collect(): Promise<MemoryMetrics> {
    if (this.platform() === 'linux') {
      try {
        return await this.collectFromProcMeminfo()
      } catch {
        // fall through to the generic os-module path below
      }
    }
    return this.collectFromOsModule()
  }

  private async collectFromProcMeminfo(): Promise<MemoryMetrics> {
    const raw = await this.readFile(MEMINFO_PATH, 'utf8')
    const values = new Map<string, number>()
    for (const line of raw.split('\n')) {
      const match = MEMINFO_LINE.exec(line.trim())
      if (match) values.set(match[1], Number(match[2]) * 1024)
    }

    const totalBytes = values.get('MemTotal') ?? 0
    const freeBytes = values.get('MemFree') ?? 0
    const availableBytes = values.get('MemAvailable') ?? freeBytes
    const bufferedBytes = values.get('Buffers') ?? 0
    const cachedBytes = values.get('Cached') ?? 0
    const swapTotalBytes = values.get('SwapTotal') ?? 0
    const swapFreeBytes = values.get('SwapFree') ?? 0
    const usedBytes = totalBytes - availableBytes

    return {
      totalBytes,
      freeBytes,
      availableBytes,
      bufferedBytes,
      cachedBytes,
      usedBytes,
      usedPercent: totalBytes ? Math.round((usedBytes / totalBytes) * 10000) / 100 : 0,
      swapTotalBytes,
      swapFreeBytes,
      swapUsedBytes: swapTotalBytes - swapFreeBytes
    }
  }

  private collectFromOsModule(): MemoryMetrics {
    const totalBytes = this.totalmem()
    const freeBytes = this.freemem()
    const usedBytes = totalBytes - freeBytes

    return {
      totalBytes,
      freeBytes,
      availableBytes: freeBytes,
      bufferedBytes: 0,
      cachedBytes: 0,
      usedBytes,
      usedPercent: totalBytes ? Math.round((usedBytes / totalBytes) * 10000) / 100 : 0,
      swapTotalBytes: 0,
      swapFreeBytes: 0,
      swapUsedBytes: 0
    }
  }
}
