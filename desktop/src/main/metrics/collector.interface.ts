export interface MetricCollector<T> {
  collect(): Promise<T>
}
