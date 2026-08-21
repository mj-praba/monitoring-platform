import os from 'node:os'
import type { NetworkInterfaceInfo, NetworkMetrics } from '../../shared/types/metrics.types'
import type { MetricCollector } from './collector.interface'

export class NetworkCollector implements MetricCollector<NetworkMetrics> {
  constructor(
    private readonly readInterfaces: () => NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces
  ) {}

  async collect(): Promise<NetworkMetrics> {
    const raw = this.readInterfaces()
    const interfaces: NetworkInterfaceInfo[] = []

    for (const [name, addresses] of Object.entries(raw)) {
      for (const address of addresses ?? []) {
        interfaces.push({
          name,
          address: address.address,
          family: address.family,
          mac: address.mac,
          internal: address.internal
        })
      }
    }

    return { interfaces }
  }
}
