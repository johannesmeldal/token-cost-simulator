import { useEffect, useRef } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import { useOrgStore } from '../store/useOrgStore'
import { useGovernanceStore } from '../store/useGovernanceStore'
import { generateTokens, getEventType } from '../simulation/profiles'
import type { SimulationEvent } from '../types/simulation'

const INTERVAL_MS: Record<1 | 5 | 20, number> = { 1: 1000, 5: 200, 20: 50 }
const HISTORY_INTERVAL = 10 // record history every N ticks

export function useSimulation() {
  const { isRunning, speed, pushEvent, pushHistory, incrementTick, tick } = useSimulationStore()
  const { users, teams, organization, userUsage, teamUsage, addUsage, blockUser } = useOrgStore()
  const { policy } = useGovernanceStore()

  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    if (!isRunning || !organization) return

    const interval = setInterval(() => {
      const activeUsers = users.filter(u => u.isEnabled && !userUsage[u.id]?.isBlocked)

      for (const user of activeUsers) {
        const tokens = generateTokens(user.simulationProfile)
        if (tokens === 0) continue

        addUsage(user.id, tokens)

        const currentUserSpent = (userUsage[user.id]?.spentTokens ?? 0) + tokens
        const currentTeamSpent = user.teamId ? (teamUsage[user.teamId] ?? 0) + tokens : 0
        const orgSpent = Object.values(teamUsage).reduce((a, b) => a + b, 0) + tokens

        const team = teams.find(t => t.id === user.teamId)

        // Determine event type
        let eventType: SimulationEvent['type'] = getEventType(user.simulationProfile, tokens)
        let severity: SimulationEvent['severity'] = 'info'

        const { individualQuotas, teamBudgets } = policy.budgetStructure
        const isHard = policy.enforcement === 'hard'

        // Individual quota checks
        if (individualQuotas && user.quotaTokens > 0) {
          const pct = currentUserSpent / user.quotaTokens
          if (pct >= 1) {
            if (isHard) blockUser(user.id)
            eventType = 'quota_exceeded'
            severity = 'error'
          } else if (pct >= 0.9 && currentUserSpent - tokens < user.quotaTokens * 0.9) {
            eventType = 'quota_warning_90'
            severity = 'warning'
          } else if (pct >= 0.75 && currentUserSpent - tokens < user.quotaTokens * 0.75) {
            eventType = 'quota_warning_75'
            severity = 'warning'
          }
        }

        // Team budget checks
        if (teamBudgets && team && team.allocatedTokens > 0) {
          const pct = currentTeamSpent / team.allocatedTokens
          if (pct >= 1 && eventType !== 'quota_exceeded') {
            eventType = 'budget_exhausted'
            severity = 'critical'
          } else if (pct >= 0.9 && severity === 'info') {
            eventType = 'quota_warning_90'
            severity = 'warning'
          }
        }

        // Org budget check
        const orgPct = orgSpent / organization.totalBudgetTokens
        if (orgPct >= 0.9 && severity === 'info') {
          eventType = 'org_budget_critical'
          severity = 'critical'
        }

        const eventMessages: Record<SimulationEvent['type'], string> = {
          prompt_submitted: `Sendte prompt (${tokens.toLocaleString('no')} tokens)`,
          large_context: `Stor kontekstforespørsel (${tokens.toLocaleString('no')} tokens)`,
          agent_mode_session: `Agent Mode-sesjon startet (${tokens.toLocaleString('no')} tokens)`,
          quota_warning_75: `Advarsel: 75% av kvoten brukt`,
          quota_warning_90: `Advarsel: 90% av kvoten brukt`,
          quota_exceeded: `Kvote overskredet — ${isHard ? 'tilgang blokkert' : 'fortsetter på soft limit'}`,
          budget_exhausted: `Teambudsjett oppbrukt!`,
          org_budget_critical: `Org-budsjett kritisk lavt (>90%)`,
        }

        const event: SimulationEvent = {
          id: `${Date.now()}-${user.id}`,
          timestamp: Date.now(),
          userId: user.id,
          userName: user.name,
          teamId: user.teamId ?? '',
          teamName: team?.name ?? '',
          type: eventType,
          severity,
          tokensConsumed: tokens,
          message: eventMessages[eventType],
        }

        pushEvent(event)
      }

      incrementTick()

      // Record history snapshot every N ticks for trend charts
      if ((tickRef.current + 1) % HISTORY_INTERVAL === 0) {
        pushHistory({
          tick: tickRef.current + 1,
          timestamp: Date.now(),
          orgSpent: Object.values(teamUsage).reduce((a, b) => a + b, 0),
          teamSpent: { ...teamUsage },
          userSpent: Object.fromEntries(
            Object.entries(userUsage).map(([id, u]) => [id, u.spentTokens])
          ),
        })
      }
    }, INTERVAL_MS[speed])

    return () => clearInterval(interval)
  }, [isRunning, speed, users, teams, organization, policy]) // eslint-disable-line react-hooks/exhaustive-deps
}
