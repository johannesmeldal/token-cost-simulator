import type { ReactNode } from 'react'
import Tooltip from './Tooltip'

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  icon?: ReactNode
  accent?: string
  tooltip?: ReactNode
  children?: ReactNode
}

export default function StatCard({ label, value, sublabel, icon, accent = 'text-accent-blue', tooltip, children }: StatCardProps) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        {icon && <span className={accent}>{icon}</span>}
      </div>
      <div>
        {tooltip ? (
          <Tooltip content={tooltip}>
            <span className={`text-2xl font-semibold font-mono ${accent} cursor-help underline decoration-dotted underline-offset-4`}>
              {value}
            </span>
          </Tooltip>
        ) : (
          <div className={`text-2xl font-semibold font-mono ${accent}`}>{value}</div>
        )}
        {sublabel && <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>}
      </div>
      {children}
    </div>
  )
}
