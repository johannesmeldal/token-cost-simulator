import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fallbackTeams } from '../data/fallbackMock'
import type { Team } from '../types/org'

interface DbTeam {
  id: string
  organization_id: string
  name: string
  allocated_credits: number
  manager_user_id: string | null
}

function fromDb(row: DbTeam): Team {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    allocatedCredits: row.allocated_credits,
    managerUserId: row.manager_user_id,
  }
}

export async function fetchTeams(organizationId: string): Promise<Team[]> {
  if (!isSupabaseConfigured) return fallbackTeams

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error || !data) {
    console.warn('[teamService] Fetch failed, using fallback:', error?.message)
    return fallbackTeams
  }

  return (data as DbTeam[]).map(fromDb)
}

export async function createTeam(
  organizationId: string,
  name: string,
  allocatedCredits: number,
  managerUserId: string | null
): Promise<Team | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('teams')
    .insert({ organization_id: organizationId, name, allocated_credits: allocatedCredits, manager_user_id: managerUserId })
    .select()
    .single()

  if (error || !data) {
    console.error('[teamService] Create failed:', error?.message)
    return null
  }

  return fromDb(data as DbTeam)
}

export async function updateTeam(
  id: string,
  updates: Partial<Pick<Team, 'name' | 'allocatedCredits' | 'managerUserId'>>
): Promise<void> {
  if (!isSupabaseConfigured) return

  const dbUpdates: Partial<DbTeam> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.allocatedCredits !== undefined) dbUpdates.allocated_credits = updates.allocatedCredits
  if (updates.managerUserId !== undefined) dbUpdates.manager_user_id = updates.managerUserId

  const { error } = await supabase.from('teams').update(dbUpdates).eq('id', id)
  if (error) console.error('[teamService] Update failed:', error.message)
}

export async function deleteTeam(id: string): Promise<void> {
  if (!isSupabaseConfigured) return

  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) console.error('[teamService] Delete failed:', error.message)
}
