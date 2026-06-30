import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useSimulationStore } from '../../store/useSimulationStore'

interface UsageTrendChartProps {
  /** 'org' | teamId | userId */
  scope: 'org' | string
  quota?: number
  label?: string
  color?: string
}

function formatTick(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function UsageTrendChart({ scope, quota, label = 'Forbruk', color = '#58a6ff' }: UsageTrendChartProps) {
  const history = useSimulationStore(s => s.history)

  const data = history.map((h, i) => ({
    tick: i,
    value:
      scope === 'org'
        ? h.orgSpent
        : h.teamSpent[scope] ?? h.userSpent[scope] ?? 0,
  }))

  if (data.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-gray-500">
        Starter simulering for å se trend…
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={128}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="tick" hide />
        <YAxis tickFormatter={formatTick} width={36} tick={{ fontSize: 10, fill: '#6e7681' }} />
        <Tooltip
          formatter={(v: number) => [formatTick(v), label]}
          contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, fontSize: 11 }}
          labelStyle={{ display: 'none' }}
        />
        {quota && (
          <ReferenceLine
            y={quota}
            stroke="#f85149"
            strokeDasharray="4 2"
            label={{ value: 'Kvote', fill: '#f85149', fontSize: 10, position: 'right' }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
