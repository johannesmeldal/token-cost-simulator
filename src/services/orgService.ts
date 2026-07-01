import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fallbackOrg } from '../data/fallbackMock'
import type { Organization } from '../types/org'

interface DbOrganization {
  id: string
  name: string
  total_budget_credits: number
  currency: string
  tokens_per_nok: number
}

function fromDb(row: DbOrganization): Organization {
  return {
    id: row.id,
    name: row.name,
    totalBudgetCredits: row.total_budget_credits,
    currency: row.currency,
    tokensPerNok: row.tokens_per_nok,
  }
}

export async function fetchOrganization(): Promise<Organization> {
  if (!isSupabaseConfigured) return fallbackOrg

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(1)
    .single()

  if (error || !data) {
    console.warn('[orgService] Fetch failed, using fallback:', error?.message)
    return fallbackOrg
  }

  return fromDb(data as DbOrganization)
}

export async function updateOrganizationBudget(
  id: string,
  totalBudgetCredits: number
): Promise<void> {
  if (!isSupabaseConfigured) return

  const { error } = await supabase
    .from('organizations')
    .update({ total_budget_credits: totalBudgetCredits })
    .eq('id', id)

  if (error) console.error('[orgService] Update failed:', error.message)
}
