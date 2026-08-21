const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const exponent = Math.min(Math.floor(Math.log2(bytes) / 10), BYTE_UNITS.length - 1)
  const value = bytes / 2 ** (exponent * 10)
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`
}

export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

export function formatDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (days || hours) parts.push(`${hours}h`)
  if (days || hours || minutes) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)
  return parts.join(' ')
}
