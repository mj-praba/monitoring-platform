export type MetricsProducer<T> = () => Promise<T>
export type MetricsListener<T> = (value: T) => void

export class MetricsPoller<T> {
  private timer: NodeJS.Timeout | null = null
  private readonly listeners = new Set<MetricsListener<T>>()

  constructor(
    private readonly produce: MetricsProducer<T>,
    private readonly intervalMs: number
  ) {}

  subscribe(listener: MetricsListener<T>): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      void this.tick()
    }, this.intervalMs)
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  private async tick(): Promise<void> {
    try {
      const value = await this.produce()
      for (const listener of this.listeners) listener(value)
    } catch (error) {
      console.error('[MetricsPoller] tick failed', error)
    }
  }
}
