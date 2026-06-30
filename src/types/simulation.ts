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
  message: string
}

export interface HistoricalDataPoint {
  tick: number
  timestamp: number
  orgSpent: number
  teamSpent: Record<string, number>
  userSpent: Record<string, number>
}
