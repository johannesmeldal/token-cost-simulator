import { Play, Pause, RotateCcw } from 'lucide-react'
import { useSimulationStore } from '../../store/useSimulationStore'
import { useOrgStore } from '../../store/useOrgStore'
import type { SimulationSpeed } from '../../types/simulation'

const speeds: SimulationSpeed[] = [1, 5, 20]

export default function SimulationControls() {
  const { isRunning, speed, start, pause, setSpeed, reset } = useSimulationStore()
  const resetUsage = useOrgStore(s => s.resetUsage)

  function handleReset() {
    reset()
    resetUsage()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRunning ? pause : start}
        className="flex items-center gap-1.5 rounded-md bg-accent-blue/10 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/20 transition-colors"
      >
        {isRunning ? <Pause size={12} /> : <Play size={12} />}
        {isRunning ? 'Pause' : 'Start'}
      </button>

      <div className="flex rounded-md border border-surface-border overflow-hidden">
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2.5 py-1.5 text-xs font-mono transition-colors ${speed === s ? 'bg-surface-hover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            ×{s}
          </button>
        ))}
      </div>

      <button
        onClick={handleReset}
        className="rounded-md p-1.5 text-gray-500 hover:text-gray-300 hover:bg-surface-hover transition-colors"
        title="Tilbakestill simulering"
      >
        <RotateCcw size={13} />
      </button>
    </div>
  )
}
