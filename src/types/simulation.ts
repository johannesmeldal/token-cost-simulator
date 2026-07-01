import type { ModelId } from '../data/pricing'

export type SimulationSpeed = 1 | 5 | 20

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface SimulationEvent {
  id: string
  timestamp: number
  userId: string
  userName: string
  teamId: string
  teamName: string
  type:
    | 'prompt_submitted'
    | 'large_context'
    | 'agent_mode_session'
    | 'quota_warning_75'
    | 'quota_warning_90'
    | 'quota_exceeded'
    | 'budget_exhausted'
    | 'org_budget_critical'
  severity: EventSeverity
  tokensConsumed: number
  /** Modellen "auto"-velgeren trakk for denne hendelsen */
  modelId: ModelId
  message: string
}

/**
 * Periode 2 (fra 2026-06-01): per-intervall NOK-delta for live-simuleringen.
 * timestamp er simulert kalendertid (se simulation/clock.ts), ikke wall-clock.
 * Delta (ikke kumulativt) fordi dag/uke/måned/år-bøtting krever summerbare verdier.
 */
export interface HistoricalDataPoint {
  tick: number
  timestamp: number
  orgNokDelta: number
  teamNokDelta: Record<string, number>
  userNokDelta: Record<string, number>
}

/**
 * Periode 1 (2026-01-01 → 2026-06-01): statisk, forhåndsgenerert daglig
 * NOK-forbruk basert på den gamle premium-prompt-prisingen.
 */
export interface Period1DailyPoint {
  /** 'YYYY-MM-DD' (UTC) */
  date: string
  orgNok: number
  teamNok: Record<string, number>
  userNok: Record<string, number>
}
