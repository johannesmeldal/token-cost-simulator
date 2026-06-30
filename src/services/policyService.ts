import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fallbackPolicy } from '../data/fallbackMock'
import { DEFAULT_POLICY } from '../types/governance'
import type { GovernancePolicy } from '../types/governance'

export async function fetchPolicy(organizationId: string): Promise<GovernancePolicy> {
  if (!isSupabaseConfigured) return fallbackPolicy

  const { data, error } = await supabase
    .from('governance_policies')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (error || !data) {
    console.warn('[policyService] Fetch failed, using default:', error?.message)
    return DEFAULT_POLICY
  }

  return {
    budgetStructure: data.budget_structure ?? DEFAULT_POLICY.budgetStructure,
    enforcement: data.enforcement ?? DEFAULT_POLICY.enforcement,
    chargeback: data.chargeback ?? DEFAULT_POLICY.chargeback,
    transparency: data.transparency ?? DEFAULT_POLICY.transparency,
  } as GovernancePolicy
}

export async function upsertPolicy(
  organizationId: string,
  policy: GovernancePolicy
): Promise<void> {
  if (!isSupabaseConfigured) return

  const { error } = await supabase.from('governance_policies').upsert(
    {
      organization_id: organizationId,
      budget_structure: policy.budgetStructure,
      enforcement: policy.enforcement,
      chargeback: policy.chargeback,
      transparency: policy.transparency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id' }
  )

  if (error) console.error('[policyService] Upsert failed:', error.message)
}
