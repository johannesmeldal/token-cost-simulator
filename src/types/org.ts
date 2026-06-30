export type SimulationProfile =
  | 'normal_developer'
  | 'power_user'
  | 'intern'
  | 'experimental_user'

export type UserRole = 'org_admin' | 'team_admin' | 'developer'

export interface Organization {
  id: string
  name: string
  totalBudgetTokens: number
  currency: string
  tokensPerNok: number
}

export interface Team {
  id: string
  organizationId: string
  name: string
  allocatedTokens: number
  managerUserId: string | null
}

export interface User {
  id: string
  organizationId: string
  teamId: string | null
  name: string
  role: UserRole
  simulationProfile: SimulationProfile
  quotaTokens: number
  isEnabled: boolean
}

// Runtime-only state accumulated by the simulation engine (never persisted)
export interface RuntimeUsage {
  spentTokens: number
  /** Kreditter forbrukt totalt (inkludert + overflow) */
  spentCredits: number
  /** Av disse: kreditter utover inkludert kvote (trekker fra org overflow-pool) */
  overflowCredits: number
  isBlocked: boolean
}

export type TeamUsageMap = Record<string, number>         // teamId → spentTokens
export type UserUsageMap = Record<string, RuntimeUsage>   // userId → runtime state
