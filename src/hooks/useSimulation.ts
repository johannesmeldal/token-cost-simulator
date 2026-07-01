import { useEffect, useRef } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import { useOrgStore } from '../store/useOrgStore'
import { useGovernanceStore } from '../store/useGovernanceStore'
import { generateTokens, getEventType, pickModel } from '../simulation/profiles'
import { tokensToCredits, creditsToNok } from '../utils/cost'
import { tickToTimestamp } from '../simulation/clock'
import type { SimulationEvent } from '../types/simulation'

const INTERVAL_MS: Record<1 | 5 | 20, number> = { 1: 1000, 5: 200, 20: 50 }
const HISTORY_INTERVAL = 10 // record history every N ticks

interface NokAccumulator {
  org: number
  team: Record<string, number>
  user: Record<string, number>
}

function emptyAccumulator(): NokAccumulator {
  return { org: 0, team: {}, user: {} }
}

export function useSimulation() {
  const { isRunning, speed, pushEvent, pushHistory, incrementTick, tick } = useSimulationStore()
  const { users, teams, organization, userUsage, teamUsage, addUsage, blockUser } = useOrgStore()
  const { policy } = useGovernanceStore()

  const tickRef = useRef(tick)
  tickRef.current = tick

  const accRef = useRef<NokAccumulator>(emptyAccumulator())

  // Nullstill NOK-akkumulatoren når tick nullstilles (Reset-knappen) — ellers
  // henger forbruk fra før reset igjen og lekker inn i neste historikk-punkt.
  useEffect(() => {
    if (tick === 0) accRef.current = emptyAccumulator()
  }, [tick])

  useEffect(() => {
    if (!isRunning || !organization) return

    const interval = setInterval(() => {
      const activeUsers = users.filter(u => u.isEnabled && !userUsage[u.id]?.isBlocked)

      for (const user of activeUsers) {
        const tokens = generateTokens(user.simulationProfile)
        if (tokens === 0) continue

        const modelId = pickModel(user.simulationProfile)
        const creditsThisEvent = tokensToCredits(tokens, modelId)

        addUsage(user.id, tokens, modelId)

        const currentUserCredits = (userUsage[user.id]?.spentCredits ?? 0) + creditsThisEvent
        const currentTeamCredits = user.teamId ? (teamUsage[user.teamId]?.spentCredits ?? 0) + creditsThisEvent : 0
        const orgCredits =
          Object.values(teamUsage).reduce((a, t) => a + t.spentCredits, 0) + creditsThisEvent

        const team = teams.find(t => t.id === user.teamId)

        // Determine event type
        let eventType: SimulationEvent['type'] = getEventType(user.simulationProfile, tokens)
        let severity: SimulationEvent['severity'] = 'info'

        const { individualQuotas, teamBudgets } = policy.budgetStructure
        const isHard = policy.enforcement === 'hard'

        // Individual quota checks (kreditter)
        if (individualQuotas && user.quotaCredits > 0) {
          const pct = currentUserCredits / user.quotaCredits
          if (pct >= 1) {
            if (isHard) blockUser(user.id)
            eventType = 'quota_exceeded'
            severity = 'error'
          } else if (pct >= 0.9 && currentUserCredits - creditsThisEvent < user.quotaCredits * 0.9) {
            eventType = 'quota_warning_90'
            severity = 'warning'
          } else if (pct >= 0.75 && currentUserCredits - creditsThisEvent < user.quotaCredits * 0.75) {
            eventType = 'quota_warning_75'
            severity = 'warning'
          }
        }

        // Team budget checks (kreditter)
        if (teamBudgets && team && team.allocatedCredits > 0) {
          const pct = currentTeamCredits / team.allocatedCredits
          if (pct >= 1 && eventType !== 'quota_exceeded') {
            eventType = 'budget_exhausted'
            severity = 'critical'
          } else if (pct >= 0.9 && severity === 'info') {
            eventType = 'quota_warning_90'
            severity = 'warning'
          }
        }

        // Org budget check (kreditter)
        const orgPct = orgCredits / organization.totalBudgetCredits
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
          modelId,
          message: eventMessages[eventType],
        }

        pushEvent(event)

        // Akkumuler NOK-delta for graf-historikk
        const nokThisEvent = creditsToNok(creditsThisEvent)
        accRef.current.org += nokThisEvent
        if (user.teamId) {
          accRef.current.team[user.teamId] = (accRef.current.team[user.teamId] ?? 0) + nokThisEvent
        }
        accRef.current.user[user.id] = (accRef.current.user[user.id] ?? 0) + nokThisEvent
      }

      incrementTick()

      // Record history snapshot every N ticks for trend charts
      if ((tickRef.current + 1) % HISTORY_INTERVAL === 0) {
        pushHistory({
          tick: tickRef.current + 1,
          timestamp: tickToTimestamp(tickRef.current + 1),
          orgNokDelta: accRef.current.org,
          teamNokDelta: { ...accRef.current.team },
          userNokDelta: { ...accRef.current.user },
        })
        accRef.current = emptyAccumulator()
      }
    }, INTERVAL_MS[speed])

    return () => clearInterval(interval)
  }, [isRunning, speed, users, teams, organization, policy]) // eslint-disable-line react-hooks/exhaustive-deps
}
