import type { ModelId } from '../data/pricing'

export type SimulationProfile =
  | 'normal_developer'
  | 'power_user'
  | 'intern'
  | 'experimental_user'

export type UserRole = 'org_admin' | 'team_admin' | 'developer'

export interface Organization {
  id: string
  name: string
  totalBudgetCredits: number
  currency: string
  tokensPerNok: number
}

export interface Team {
  id: string
  organizationId: string
  name: string
  allocatedCredits: number
  managerUserId: string | null
}

export interface User {
  id: string
  organizationId: string
  teamId: string | null
  name: string
  role: UserRole
  simulationProfile: SimulationProfile
  quotaCredits: number
  isEnabled: boolean
}

// Runtime-only state accumulated by the simulation engine (never persisted)
export interface RuntimeUsage {
  spentTokens: number
  /** Kreditter forbrukt totalt (inkludert + overflow) */
  spentCredits: number
  /** Av disse: kreditter utover inkludert kvote (trekker fra org overflow-pool) */
  overflowCredits: number
  /** Bakgrunns-bokføring: rå tokens forbrukt per modell */
  tokensByModel: Partial<Record<ModelId, number>>
  /** Bakgrunns-bokføring: kreditter forbrukt per modell */
  creditsByModel: Partial<Record<ModelId, number>>
  isBlocked: boolean
}

// Runtime-only team state — speiler RuntimeUsage slik at team-nivå også er kreditt-bevisst
export interface TeamRuntimeUsage {
  spentTokens: number
  spentCredits: number
  tokensByModel: Partial<Record<ModelId, number>>
  creditsByModel: Partial<Record<ModelId, number>>
}

export type TeamUsageMap = Record<string, TeamRuntimeUsage>  // teamId → runtime state
export type UserUsageMap = Record<string, RuntimeUsage>       // userId → runtime state
