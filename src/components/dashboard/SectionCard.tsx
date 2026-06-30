import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

export default function SectionCard({ title, subtitle, children, action, className = '' }: SectionCardProps) {
  return (
    <div className={`rounded-lg border border-surface-border bg-surface-card ${className}`}>
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
