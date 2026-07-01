import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fallbackUsers } from '../data/fallbackMock'
import type { User, SimulationProfile, UserRole } from '../types/org'

interface DbUser {
  id: string
  organization_id: string
  team_id: string | null
  name: string
  role: UserRole
  simulation_profile: SimulationProfile
  quota_credits: number
  is_enabled: boolean
}

function fromDb(row: DbUser): User {
  return {
    id: row.id,
    organizationId: row.organization_id,
    teamId: row.team_id,
    name: row.name,
    role: row.role,
    simulationProfile: row.simulation_profile,
    quotaCredits: row.quota_credits,
    isEnabled: row.is_enabled,
  }
}

export async function fetchUsers(organizationId: string): Promise<User[]> {
  if (!isSupabaseConfigured) return fallbackUsers

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error || !data) {
    console.warn('[userService] Fetch failed, using fallback:', error?.message)
    return fallbackUsers
  }

  return (data as DbUser[]).map(fromDb)
}

export async function createUser(
  organizationId: string,
  teamId: string | null,
  name: string,
  role: UserRole,
  simulationProfile: SimulationProfile,
  quotaCredits: number
): Promise<User | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('users')
    .insert({
      organization_id: organizationId,
      team_id: teamId,
      name,
      role,
      simulation_profile: simulationProfile,
      quota_credits: quotaCredits,
      is_enabled: true,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[userService] Create failed:', error?.message)
    return null
  }

  return fromDb(data as DbUser)
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'name' | 'teamId' | 'role' | 'simulationProfile' | 'quotaCredits' | 'isEnabled'>>
): Promise<void> {
  if (!isSupabaseConfigured) return

  const dbUpdates: Partial<DbUser> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.simulationProfile !== undefined) dbUpdates.simulation_profile = updates.simulationProfile
  if (updates.quotaCredits !== undefined) dbUpdates.quota_credits = updates.quotaCredits
  if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled

  const { error } = await supabase.from('users').update(dbUpdates).eq('id', id)
  if (error) console.error('[userService] Update failed:', error.message)
}

export async function deleteUser(id: string): Promise<void> {
  if (!isSupabaseConfigured) return

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) console.error('[userService] Delete failed:', error.message)
}
