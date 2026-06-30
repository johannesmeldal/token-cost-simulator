import { create } from 'zustand'
import type { GovernancePolicy, BudgetStructure, Transparency, Enforcement, Chargeback } from '../types/governance'
import { DEFAULT_POLICY } from '../types/governance'
import { fetchPolicy, upsertPolicy } from '../services/policyService'
import type { UserRole } from '../types/org'

interface ActiveIdentity {
  role: UserRole
  userId: string
  teamId: string | null
}

interface GovernanceState {
  policy: GovernancePolicy
  activeIdentity: ActiveIdentity
  isLoaded: boolean

  loadPolicy: (organizationId: string) => Promise<void>

  // Granular setters — each persists to Supabase automatically
  setBudgetStructure: (orgId: string, updates: Partial<BudgetStructure>) => Promise<void>
  setEnforcement: (orgId: string, enforcement: Enforcement) => Promise<void>
  setChargeback: (orgId: string, chargeback: Chargeback) => Promise<void>
  setTransparency: (orgId: string, updates: Partial<Transparency>) => Promise<void>

  // Role switcher (demo-only, no auth)
  setActiveIdentity: (identity: ActiveIdentity) => void
}

export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  policy: DEFAULT_POLICY,
  activeIdentity: { role: 'org_admin', userId: 'user-1', teamId: null },
  isLoaded: false,

  loadPolicy: async (organizationId) => {
    const policy = await fetchPolicy(organizationId)
    set({ policy, isLoaded: true })
  },

  setBudgetStructure: async (orgId, updates) => {
    const { policy } = get()
    const next = { ...policy, budgetStructure: { ...policy.budgetStructure, ...updates } }
    set({ policy: next })
    await upsertPolicy(orgId, next)
  },

  setEnforcement: async (orgId, enforcement) => {
    const { policy } = get()
    const next = { ...policy, enforcement }
    set({ policy: next })
    await upsertPolicy(orgId, next)
  },

  setChargeback: async (orgId, chargeback) => {
    const { policy } = get()
    const next = { ...policy, chargeback }
    set({ policy: next })
    await upsertPolicy(orgId, next)
  },

  setTransparency: async (orgId, updates) => {
    const { policy } = get()
    const next = { ...policy, transparency: { ...policy.transparency, ...updates } }
    set({ policy: next })
    await upsertPolicy(orgId, next)
  },

  setActiveIdentity: (identity) => set({ activeIdentity: identity }),
}))
