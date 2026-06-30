import { Bot } from 'lucide-react'
import RoleSwitcher from './RoleSwitcher'
import SimulationControls from '../simulation/SimulationControls'

export default function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-surface-border bg-surface-card px-4">
      <div className="flex items-center gap-2 text-accent-blue">
        <Bot size={20} />
        <span className="text-sm font-semibold tracking-tight">AI Governance Simulator</span>
      </div>

      <div className="mx-4 h-5 w-px bg-surface-border" />

      <SimulationControls />

      <div className="ml-auto">
        <RoleSwitcher />
      </div>
    </header>
  )
}
