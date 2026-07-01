import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useSimulationStore } from '../../store/useSimulationStore'
import { buildTrendSeries, findTransitionLabel, type Granularity } from '../../utils/timeSeries'
import { formatNok } from '../../utils/cost'
import period1Data from '../../data/period1History.json'
import type { Period1DailyPoint } from '../../types/simulation'

const period1: Period1DailyPoint[] = period1Data

interface UsageTrendChartProps {
  /** 'org' | teamId | userId */
  scope: 'org' | string
  label?: string
  color?: string
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Dag' },
  { value: 'week', label: 'Uke' },
  { value: 'month', label: 'Måned' },
  { value: 'year', label: 'År' },
]

export default function UsageTrendChart({ scope, label = 'Forbruk', color = '#58a6ff' }: UsageTrendChartProps) {
  const history = useSimulationStore(s => s.history)
  const [granularity, setGranularity] = useState<Granularity>('month')

  const data = buildTrendSeries(period1, history, scope, granularity)
  const transitionLabel = findTransitionLabel(granularity)
  const hasTransitionMarker = data.some(d => d.label === transitionLabel)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <div className="flex rounded-md border border-surface-border overflow-hidden">
          {GRANULARITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGranularity(opt.value)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                granularity === opt.value
                  ? 'bg-accent-blue/20 text-accent-blue'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-gray-500">
          Starter simulering for å se trend…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6e7681' }} />
            <YAxis tickFormatter={formatNok} width={56} tick={{ fontSize: 10, fill: '#6e7681' }} />
            <Tooltip
              formatter={(v: number) => [formatNok(v), label]}
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, fontSize: 11 }}
            />
            {hasTransitionMarker && (
              <ReferenceLine
                x={transitionLabel}
                stroke="#f85149"
                strokeDasharray="4 2"
                label={{ value: '1. jun 2026 — ny prismodell', fill: '#f85149', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={data.length <= 6 ? { r: 3, fill: color } : false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
