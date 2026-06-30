import { useSimulationStore } from '../../store/useSimulationStore'
import type { SimulationEvent } from '../../types/simulation'

const severityStyles: Record<SimulationEvent['severity'], string> = {
  info: 'text-gray-400 border-surface-border',
  warning: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/5',
  error: 'text-accent-red border-accent-red/30 bg-accent-red/5',
  critical: 'text-accent-orange border-accent-orange/40 bg-accent-orange/10',
}

const severityDot: Record<SimulationEvent['severity'], string> = {
  info: 'bg-gray-600',
  warning: 'bg-accent-yellow',
  error: 'bg-accent-red',
  critical: 'bg-accent-orange animate-pulse',
}

const typeLabel: Record<SimulationEvent['type'], string> = {
  prompt_submitted: 'Prompt',
  large_context: 'Stor kontekst',
  agent_mode_session: 'Agent Mode',
  quota_warning_75: '75% advarsel',
  quota_warning_90: '90% advarsel',
  quota_exceeded: 'Kvote overskredet',
  budget_exhausted: 'Budsjett tomt',
  org_budget_critical: 'Org kritisk',
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'nå'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m`
}

interface LiveEventFeedProps {
  maxItems?: number
  filterSeverity?: SimulationEvent['severity'][]
}

export default function LiveEventFeed({ maxItems = 20, filterSeverity }: LiveEventFeedProps) {
  const events = useSimulationStore(s => s.events)
  const isRunning = useSimulationStore(s => s.isRunning)

  const visible = filterSeverity
    ? events.filter(e => filterSeverity.includes(e.severity))
    : events

  const items = visible.slice(0, maxItems)

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {!isRunning && items.length === 0 && (
        <p className="py-4 text-center text-xs text-gray-500">Start simuleringen for å se hendelser</p>
      )}
      {items.map(e => (
        <div key={e.id} className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs border ${severityStyles[e.severity]}`}>
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[e.severity]}`} />
          <div className="min-w-0 flex-1">
            <span className="font-medium">{e.userName}</span>
            {e.teamName && <span className="text-gray-500"> · {e.teamName}</span>}
            <span className="mx-1 text-gray-600">—</span>
            <span>{typeLabel[e.type]}</span>
            <span className="ml-1 text-gray-500">{e.message.includes('tokens') ? `(${e.tokensConsumed.toLocaleString('no')} t)` : ''}</span>
          </div>
          <span className="shrink-0 tabular-nums text-gray-600">{timeAgo(e.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}
