import type { PropsWithChildren } from 'react'

export interface MetricCardProps {
  title: string
}

export function MetricCard({ title, children }: PropsWithChildren<MetricCardProps>): JSX.Element {
  return (
    <section className="metric-card">
      <h2 className="metric-card__title">{title}</h2>
      <div className="metric-card__body">{children}</div>
    </section>
  )
}
