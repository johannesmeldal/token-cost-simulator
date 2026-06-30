import Tooltip from './Tooltip'

interface QuotaGaugeProps {
  label: string
  used: number
  total: number
  sublabel?: string
  size?: 'sm' | 'md' | 'lg'
  tokensPerNok?: number
  /** Enhet som vises i tooltip: 'kreditter' | 'tokens' | 'NOK' */
  unit?: 'kreditter' | 'tokens' | 'NOK'
}

function getSeverityColor(pct: number) {
  if (pct >= 1) return { bar: 'bg-accent-red', text: 'text-accent-red' }
  if (pct >= 0.9) return { bar: 'bg-accent-orange', text: 'text-accent-orange' }
  if (pct >= 0.75) return { bar: 'bg-accent-yellow', text: 'text-accent-yellow' }
  return { bar: 'bg-accent-green', text: 'text-accent-green' }
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toString()
}

function buildTooltip(used: number, total: number, unit: string, tokensPerNok?: number) {
  const u = unit === 'kreditter' ? 'kr' : unit === 'tokens' ? 'tokens' : 'NOK'
  const lines: string[] = [
    `Brukt: ${used.toLocaleString('no')} ${u}`,
    `Totalt: ${total.toLocaleString('no')} ${u}`,
  ]
  if (unit === 'kreditter') {
    lines.push(`Brukt ≈ ${(used * 0.11).toFixed(0)} NOK`)
    lines.push('1 kreditt = $0.01 = 0.11 NOK')
  }
  if (unit === 'tokens' && tokensPerNok) {
    lines.push(`≈ ${(used / tokensPerNok).toFixed(0)} NOK brukt`)
  }
  return (
    <div className="flex flex-col gap-1">
      {lines.map(l => <span key={l}>{l}</span>)}
    </div>
  )
}

export default function QuotaGauge({ label, used, total, sublabel, size = 'md', tokensPerNok, unit = 'tokens' }: QuotaGaugeProps) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0
  const { bar, text } = getSeverityColor(pct)
  const heightClass = size === 'lg' ? 'h-3' : size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className={`font-medium ${size === 'lg' ? 'text-sm' : 'text-xs'} text-gray-300`}>{label}</span>
        <Tooltip content={buildTooltip(used, total, unit, tokensPerNok)}>
          <span className={`font-mono text-xs ${text} cursor-help underline decoration-dotted underline-offset-2`}>
            {formatTokens(used)} / {formatTokens(total)}
          </span>
        </Tooltip>
      </div>
      <div className={`w-full rounded-full bg-surface-border ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        {sublabel && <span className="text-xs text-gray-500">{sublabel}</span>}
        <Tooltip content="Prosentandel av total kvote/budsjett som er brukt">
          <span className={`ml-auto text-xs font-mono ${text} cursor-help`}>
            {(pct * 100).toFixed(1)}%
          </span>
        </Tooltip>
      </div>
    </div>
  )
}
