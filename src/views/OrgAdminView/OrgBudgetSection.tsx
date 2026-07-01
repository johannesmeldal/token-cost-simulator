import { Coins, TrendingUp, Users, AlertTriangle, Info } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import QuotaGauge from '../../components/dashboard/QuotaGauge'
import UsageTrendChart from '../../components/dashboard/UsageTrendChart'
import SectionCard from '../../components/dashboard/SectionCard'
import Tooltip from '../../components/dashboard/Tooltip'
import { useOrgStore } from '../../store/useOrgStore'
import { useGovernanceStore } from '../../store/useGovernanceStore'
import {
  creditsToNok,
  formatNok,
  formatCredits,
} from '../../utils/cost'
import {
  INCLUDED_CREDITS_PER_USER,
  ORG_OVERFLOW_BUDGET_NOK,
  ORG_OVERFLOW_BUDGET_CREDITS,
} from '../../data/pricing'

export default function OrgBudgetSection() {
  const { organization, teams, users, teamUsage, userUsage } = useOrgStore()
  const { policy } = useGovernanceStore()

  if (!organization) return null

  // ── Kredittberegninger ────────────────────────────────────────
  const payingUsers = users.filter(u => u.role !== 'org_admin')
  const totalIncludedCredits = payingUsers.length * INCLUDED_CREDITS_PER_USER

  // Summer alle brukeres kredittforbruk
  const totalCreditsUsed = Object.values(userUsage).reduce((a, b) => a + b.spentCredits, 0)
  const totalOverflowCredits = Object.values(userUsage).reduce((a, b) => a + b.overflowCredits, 0)
  const overflowNokUsed = creditsToNok(totalOverflowCredits)

  const includedPct = totalIncludedCredits > 0 ? Math.min(totalCreditsUsed / totalIncludedCredits, 1) : 0
  const overflowPct = ORG_OVERFLOW_BUDGET_NOK > 0 ? overflowNokUsed / ORG_OVERFLOW_BUDGET_NOK : 0

  const activeUsers = payingUsers.filter(u => u.isEnabled && !userUsage[u.id]?.isBlocked).length
  const blockedUsers = Object.values(userUsage).filter(u => u.isBlocked).length
  const usersInOverflow = payingUsers.filter(u => (userUsage[u.id]?.overflowCredits ?? 0) > 0).length

  // ── Alerts ───────────────────────────────────────────────────
  const alerts: string[] = []
  if (overflowPct >= 0.9) alerts.push(`Overflow-budsjettet er over 90% (${formatNok(overflowNokUsed)} av ${formatNok(ORG_OVERFLOW_BUDGET_NOK)})`)
  if (blockedUsers > 0) alerts.push(`${blockedUsers} bruker(e) blokkert av hard limit`)
  if (usersInOverflow > 0) alerts.push(`${usersInOverflow} bruker(e) har overskredet inkludert kvote og trekker fra overflow-potten`)
  teams.forEach(t => {
    const spent = teamUsage[t.id]?.spentCredits ?? 0
    if (policy.budgetStructure.teamBudgets && t.allocatedCredits > 0 && spent / t.allocatedCredits >= 0.9)
      alerts.push(`${t.name}: over 90% av teambudsjett`)
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-accent-orange/30 bg-accent-orange/10 px-4 py-3 text-sm text-accent-orange">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            {alerts.map(a => <span key={a}>{a}</span>)}
          </div>
        </div>
      )}

      {/* To-lags budsjett-forklaring */}
      <div className="flex items-start gap-2 rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-xs text-gray-400">
        <Info size={13} className="shrink-0 mt-0.5 text-accent-blue" />
        <span>
          <span className="text-gray-200 font-medium">To-lags budsjettmodell: </span>
          Hvert av de {payingUsers.length} teammedlemmene har{' '}
          <Tooltip content="Business-plan kampanje (jun–sep 2026): 3 900 inkluderte kreditter per bruker per måned. Disse er forhåndsbetalt i abonnementet.">
            <span className="text-accent-blue cursor-help underline decoration-dotted underline-offset-2">
              {INCLUDED_CREDITS_PER_USER.toLocaleString('no')} inkluderte kreditter
            </span>
          </Tooltip>
          {' '}(≈ {formatNok(creditsToNok(INCLUDED_CREDITS_PER_USER))}/bruker). Når disse er brukt opp, trekkes fra org-potten på{' '}
          <Tooltip content="Organisasjonens overflow-budsjett: det som betales ekstra når brukere overskrider inkludert kvote. Satt til 15 000 NOK for denne perioden.">
            <span className="text-accent-orange cursor-help underline decoration-dotted underline-offset-2">
              {formatNok(ORG_OVERFLOW_BUDGET_NOK)}
            </span>
          </Tooltip>.
        </span>
      </div>

      {/* Stat-kort */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Inkludert kvote brukt"
          value={formatNok(creditsToNok(Math.min(totalCreditsUsed, totalIncludedCredits)))}
          sublabel={`av ${formatNok(creditsToNok(totalIncludedCredits))} inkludert totalt`}
          icon={<Coins size={15} />}
          accent={includedPct >= 0.9 ? 'text-accent-orange' : includedPct >= 0.75 ? 'text-accent-yellow' : 'text-accent-green'}
          tooltip={
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-200">Inkludert kvote</span>
              <span>Brukt: {formatCredits(Math.min(totalCreditsUsed, totalIncludedCredits))}</span>
              <span>Totalt inkludert: {formatCredits(totalIncludedCredits)} ({payingUsers.length} brukere × {INCLUDED_CREDITS_PER_USER} kreditter)</span>
              <span className="pt-1 border-t border-surface-border text-gray-500">
                1 kreditt = $0.01 = 0.11 NOK. Disse er forhåndsbetalt i abonnementet — ikke direktekostnad.
              </span>
            </div>
          }
        />
        <StatCard
          label="Overflow brukt"
          value={formatNok(overflowNokUsed)}
          sublabel={`av ${formatNok(ORG_OVERFLOW_BUDGET_NOK)} overflow-budsjett`}
          icon={<Coins size={15} />}
          accent={overflowPct >= 0.9 ? 'text-accent-red' : overflowPct >= 0.5 ? 'text-accent-orange' : overflowPct > 0 ? 'text-accent-yellow' : 'text-gray-500'}
          tooltip={
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-200">Overflow-pool (15 000 NOK)</span>
              <span>Brukt: {formatNok(overflowNokUsed)} ({totalOverflowCredits.toFixed(1)} kr)</span>
              <span>Gjenstående: {formatNok(ORG_OVERFLOW_BUDGET_NOK - overflowNokUsed)}</span>
              <span>{usersInOverflow} bruker(e) trekker fra denne potten nå</span>
              <span className="pt-1 border-t border-surface-border text-gray-500">
                Overflow er det organisasjonen betaler ekstra når brukere har brukt opp sine {INCLUDED_CREDITS_PER_USER} inkluderte kreditter.
              </span>
            </div>
          }
        />
        <StatCard
          label="Total kostnad (estimert)"
          value={formatNok(overflowNokUsed)}
          sublabel="Kun overflow telles — inkludert er forhåndsbetalt"
          icon={<TrendingUp size={15} />}
          accent="text-accent-purple"
          tooltip={
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-200">Hva koster dette faktisk?</span>
              <span>Abonnement: {payingUsers.length} × $19/mnd = ${(payingUsers.length * 19).toLocaleString('en')}/mnd (fast)</span>
              <span>Overflow tillegg: {formatNok(overflowNokUsed)} (variabelt)</span>
              <span className="pt-1 border-t border-surface-border text-gray-500">
                Inkluderte kreditter er dekket av abonnementet. Kun overflow er reell tilleggskostnad.
              </span>
            </div>
          }
        />
        <StatCard
          label="Aktive brukere"
          value={String(activeUsers)}
          sublabel={blockedUsers > 0 ? `${blockedUsers} blokkert` : usersInOverflow > 0 ? `${usersInOverflow} i overflow` : 'Alle innenfor inkludert kvote'}
          icon={<Users size={15} />}
          accent={blockedUsers > 0 ? 'text-accent-red' : usersInOverflow > 0 ? 'text-accent-orange' : 'text-accent-green'}
          tooltip={
            <div className="flex flex-col gap-1">
              <span>Aktive (genererer tokens nå): {activeUsers}</span>
              <span>I overflow (oversteget inkludert kvote): {usersInOverflow}</span>
              {blockedUsers > 0 && <span className="text-accent-red">Blokkert av hard limit: {blockedUsers}</span>}
              <span className="pt-1 border-t border-surface-border text-gray-500">
                Blokkering aktiveres kun om Hard Limits er skrudd på og en kvote er overskredet.
              </span>
            </div>
          }
        />
      </div>

      {/* Gauge-seksjoner */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Budsjettstruktur" className="col-span-1">
          <div className="flex flex-col gap-5 pt-1">

            {/* Fase 1: inkluderte kreditter */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <span className="h-2 w-2 rounded-full bg-accent-green" />
                Fase 1 — Inkluderte kreditter
              </div>
              <QuotaGauge
                label={`${payingUsers.length} brukere × ${INCLUDED_CREDITS_PER_USER} kr`}
                used={Math.min(totalCreditsUsed, totalIncludedCredits)}
                total={totalIncludedCredits}
                sublabel="Forhåndsbetalt i abonnementet"
                size="lg"
                unit="kreditter"
              />
            </div>

            {/* Fase 2: overflow-pool */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <span className={`h-2 w-2 rounded-full ${overflowPct > 0 ? 'bg-accent-orange' : 'bg-gray-600'}`} />
                Fase 2 — Overflow-pool
              </div>
              <QuotaGauge
                label="15 000 NOK org-budsjett"
                used={totalOverflowCredits}
                total={ORG_OVERFLOW_BUDGET_CREDITS}
                sublabel={`${formatNok(overflowNokUsed)} av ${formatNok(ORG_OVERFLOW_BUDGET_NOK)} brukt`}
                size="lg"
                unit="kreditter"
              />
            </div>

            {/* Team-budsjetter om aktivert */}
            {policy.budgetStructure.teamBudgets && (
              <div className="flex flex-col gap-3 border-t border-surface-border pt-4">
                <div className="text-xs font-medium text-gray-500">Teambudsjetter</div>
                {teams.map(t => (
                  <QuotaGauge
                    key={t.id}
                    label={t.name}
                    used={creditsToNok(teamUsage[t.id]?.spentCredits ?? 0)}
                    total={creditsToNok(t.allocatedCredits)}
                    size="sm"
                    unit="NOK"
                  />
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Forbrukstrend" subtitle="Forbruk i NOK — periode 1 (premium-prompt) og periode 2 (forbruksbasert), dag/uke/måned/år" className="col-span-2">
          <UsageTrendChart scope="org" />
        </SectionCard>
      </div>
    </div>
  )
}
