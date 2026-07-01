import type { HistoricalDataPoint, Period1DailyPoint } from '../types/simulation'

export type Granularity = 'day' | 'week' | 'month' | 'year'

/** Tidspunktet GitHub Copilot gikk fra premium-prompt- til forbruksbasert prising. */
export const PERIOD_TRANSITION_TIMESTAMP = Date.UTC(2026, 5, 1)

const MONTH_LABELS = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']

const DAY_MS = 24 * 60 * 60 * 1000

function isoWeekNumber(ts: number): number {
  const d = new Date(Date.UTC(new Date(ts).getUTCFullYear(), new Date(ts).getUTCMonth(), new Date(ts).getUTCDate()))
  const weekday = (d.getUTCDay() + 6) % 7 // 0 = mandag
  d.setUTCDate(d.getUTCDate() - weekday + 3) // torsdag i samme uke
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const firstWeekday = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstWeekday + 3)
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * DAY_MS))
}

export function bucketStartFor(ts: number, granularity: Granularity): number {
  const d = new Date(ts)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  switch (granularity) {
    case 'day':
      return Date.UTC(y, m, day)
    case 'week': {
      const dayStart = Date.UTC(y, m, day)
      const weekday = (new Date(dayStart).getUTCDay() + 6) % 7 // dager siden mandag
      return dayStart - weekday * DAY_MS
    }
    case 'month':
      return Date.UTC(y, m, 1)
    case 'year':
      return Date.UTC(y, 0, 1)
  }
}

function labelFor(ts: number, granularity: Granularity): string {
  const d = new Date(ts)
  switch (granularity) {
    case 'day':
      return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    case 'week':
      return `Uke ${isoWeekNumber(ts)}`
    case 'month':
      return `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    case 'year':
      return String(d.getUTCFullYear())
  }
}

export interface TrendPoint {
  bucketStart: number
  label: string
  value: number
}

/**
 * Slår sammen periode 1 (statisk, daglig NOK) og periode 2 (live, per-intervall
 * NOK-delta) til én NOK-serie bøttet på valgt granularitet.
 */
export function buildTrendSeries(
  period1: Period1DailyPoint[],
  period2: HistoricalDataPoint[],
  scope: 'org' | string,
  granularity: Granularity
): TrendPoint[] {
  const buckets = new Map<number, number>()

  function add(ts: number, value: number) {
    const bucket = bucketStartFor(ts, granularity)
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + value)
  }

  for (const p of period1) {
    const ts = Date.parse(`${p.date}T00:00:00Z`)
    const value = scope === 'org' ? p.orgNok : (p.teamNok[scope] ?? p.userNok[scope] ?? 0)
    add(ts, value)
  }

  for (const h of period2) {
    const value = scope === 'org' ? h.orgNokDelta : (h.teamNokDelta[scope] ?? h.userNokDelta[scope] ?? 0)
    add(h.timestamp, value)
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, value]) => ({ bucketStart, label: labelFor(bucketStart, granularity), value }))
}

/** Finner label-verdien til bøtten som inneholder prismodell-overgangen, om noen. */
export function findTransitionLabel(granularity: Granularity): string {
  const bucket = bucketStartFor(PERIOD_TRANSITION_TIMESTAMP, granularity)
  return labelFor(bucket, granularity)
}
