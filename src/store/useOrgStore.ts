import { create } from 'zustand'
import type { Organization, Team, User, TeamUsageMap, UserUsageMap } from '../types/org'
import { fetchOrganization, updateOrganizationBudget } from '../services/orgService'
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '../services/teamService'
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/userService'
import type { SimulationProfile, UserRole } from '../types/org'
import { tokensToCredits } from '../utils/cost'
import { getPrimaryModel } from '../simulation/profiles'
import { INCLUDED_CREDITS_PER_USER } from '../data/pricing'

interface OrgState {
  organization: Organization | null
  teams: Team[]
  users: User[]
  // Runtime-only usage (never persisted)
  teamUsage: TeamUsageMap
  userUsage: UserUsageMap
  isLoading: boolean
  loadError: string | null

  // Bootstrap
  loadAll: () => Promise<void>

  // Runtime usage (simulation engine writes here)
  addUsage: (userId: string, tokens: number) => void
  blockUser: (userId: string) => void
  resetUsage: () => void

  // Org mutations
  setOrgBudget: (tokens: number) => Promise<void>

  // Team mutations
  addTeam: (name: string, allocatedTokens: number, managerUserId: string | null) => Promise<void>
  editTeam: (id: string, updates: Partial<Pick<Team, 'name' | 'allocatedTokens' | 'managerUserId'>>) => Promise<void>
  removeTeam: (id: string) => Promise<void>

  // User mutations
  addUser: (teamId: string | null, name: string, role: UserRole, profile: SimulationProfile, quota: number) => Promise<void>
  editUser: (id: string, updates: Partial<Pick<User, 'name' | 'teamId' | 'role' | 'simulationProfile' | 'quotaTokens' | 'isEnabled'>>) => Promise<void>
  removeUser: (id: string) => Promise<void>
}

function buildInitialUsage(users: User[], teams: Team[]): { teamUsage: TeamUsageMap; userUsage: UserUsageMap } {
  const teamUsage: TeamUsageMap = {}
  const userUsage: UserUsageMap = {}
  teams.forEach(t => { teamUsage[t.id] = 0 })
  users.forEach(u => {
    userUsage[u.id] = { spentTokens: 0, spentCredits: 0, overflowCredits: 0, isBlocked: false }
  })
  return { teamUsage, userUsage }
}

export const useOrgStore = create<OrgState>((set, get) => ({
  organization: null,
  teams: [],
  users: [],
  teamUsage: {},
  userUsage: {},
  isLoading: false,
  loadError: null,

  loadAll: async () => {
    set({ isLoading: true, loadError: null })
    try {
      const organization = await fetchOrganization()
      const [teams, users] = await Promise.all([
        fetchTeams(organization.id),
        fetchUsers(organization.id),
      ])
      const { teamUsage, userUsage } = buildInitialUsage(users, teams)
      set({ organization, teams, users, teamUsage, userUsage, isLoading: false })
    } catch (err) {
      set({ isLoading: false, loadError: String(err) })
    }
  },

  addUsage: (userId, tokens) => {
    const { users, userUsage, teamUsage, organization } = get()
    if (!organization) return

    const user = users.find(u => u.id === userId)
    if (!user || !userUsage[userId] || userUsage[userId].isBlocked) return

    // Konverter tokens → kreditter basert på brukerens simuleringsmodell
    const newCredits = tokensToCredits(tokens, getPrimaryModel(user.simulationProfile))
    const prevCredits = userUsage[userId].spentCredits
    const newSpentCredits = prevCredits + newCredits

    // Beregn overflow: kreditter utover inkludert kvote (3 900 kr)
    const newOverflow = Math.max(0, newSpentCredits - INCLUDED_CREDITS_PER_USER)

    const newTeamUsage = user.teamId
      ? { ...teamUsage, [user.teamId]: (teamUsage[user.teamId] ?? 0) + tokens }
      : teamUsage

    set({
      userUsage: {
        ...userUsage,
        [userId]: {
          ...userUsage[userId],
          spentTokens: (userUsage[userId].spentTokens) + tokens,
          spentCredits: newSpentCredits,
          overflowCredits: newOverflow,
        },
      },
      teamUsage: newTeamUsage,
    })
  },

  blockUser: (userId) => {
    const { userUsage } = get()
    if (!userUsage[userId]) return
    set({ userUsage: { ...userUsage, [userId]: { ...userUsage[userId], isBlocked: true } } })
  },

  resetUsage: () => {
    const { users, teams } = get()
    set(buildInitialUsage(users, teams))
  },

  setOrgBudget: async (tokens) => {
    const { organization } = get()
    if (!organization) return
    await updateOrganizationBudget(organization.id, tokens)
    set({ organization: { ...organization, totalBudgetTokens: tokens } })
  },

  addTeam: async (name, allocatedTokens, managerUserId) => {
    const { organization, teams, teamUsage } = get()
    if (!organization) return
    const created = await createTeam(organization.id, name, allocatedTokens, managerUserId)
    if (created) {
      set({ teams: [...teams, created], teamUsage: { ...teamUsage, [created.id]: 0 } })
    }
  },

  editTeam: async (id, updates) => {
    await updateTeam(id, updates)
    set(state => ({ teams: state.teams.map(t => t.id === id ? { ...t, ...updates } : t) }))
  },

  removeTeam: async (id) => {
    await deleteTeam(id)
    set(state => {
      const { [id]: _, ...rest } = state.teamUsage
      return { teams: state.teams.filter(t => t.id !== id), teamUsage: rest }
    })
  },

  addUser: async (teamId, name, role, profile, quota) => {
    const { organization, users, userUsage } = get()
    if (!organization) return
    const created = await createUser(organization.id, teamId, name, role, profile, quota)
    if (created) {
      set({
        users: [...users, created],
        userUsage: {
          ...userUsage,
          [created.id]: { spentTokens: 0, spentCredits: 0, overflowCredits: 0, isBlocked: false },
        },
      })
    }
  },

  editUser: async (id, updates) => {
    await updateUser(id, updates)
    set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...updates } : u) }))
  },

  removeUser: async (id) => {
    await deleteUser(id)
    set(state => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = state.userUsage
      return { users: state.users.filter(u => u.id !== id), userUsage: rest }
    })
  },
}))
