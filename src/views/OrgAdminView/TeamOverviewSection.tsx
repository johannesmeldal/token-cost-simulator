import { ArrowUpDown } from 'lucide-react'
import SectionCard from '../../components/dashboard/SectionCard'
import Tooltip from '../../components/dashboard/Tooltip'
import { useOrgStore } from '../../store/useOrgStore'
import { useGovernanceStore } from '../../store/useGovernanceStore'
import { creditsToNok, formatNok, formatCredits, formatTokens } from '../../utils/cost'
import { MODELS } from '../../data/pricing'

function UtilizationBar({ pct }: { pct: number }) {
  const color =
    pct >= 1 ? 'bg-accent-red' :
    pct >= 0.9 ? 'bg-accent-orange' :
    pct >= 0.75 ? 'bg-accent-yellow' :
    'bg-accent-green'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-surface-border overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
      <span className={`text-xs font-mono ${pct >= 0.9 ? 'text-accent-orange' : 'text-gray-400'}`}>
        {(pct * 100).toFixed(1)}%
      </span>
    </div>
  )
}

export default function TeamOverviewSection() {
  const { teams, users, teamUsage } = useOrgStore()
  const { policy } = useGovernanceStore()
  const showTeamBudgets = policy.budgetStructure.teamBudgets

  const rows = teams
    .map(t => {
      const members = users.filter(u => u.teamId === t.id)
      const usage = teamUsage[t.id]
      const spentCredits = usage?.spentCredits ?? 0
      const pct = t.allocatedCredits > 0 ? spentCredits / t.allocatedCredits : 0
      const manager = users.find(u => u.id === t.managerUserId)
      return { ...t, members: members.length, spentCredits, spentTokens: usage?.spentTokens ?? 0, creditsByModel: usage?.creditsByModel ?? {}, tokensByModel: usage?.tokensByModel ?? {}, pct, manager }
    })
    .sort((a, b) => b.spentCredits - a.spentCredits)

  return (
    <SectionCard title="Teamoversikt" subtitle={`${teams.length} team · sortert etter forbruk`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-xs text-gray-500">
            <th className="pb-2 text-left font-normal">Team</th>
            <th className="pb-2 text-left font-normal">Leder</th>
            <th className="pb-2 text-right font-normal">Medlemmer</th>
            <th className="pb-2 text-right font-normal">
              <Tooltip content="Teamets forbruk omregnet til NOK. Hold over verdien for å se rå tokens/kreditter og fordeling per modell.">
                <span className="cursor-help underline decoration-dotted underline-offset-2">Forbruk</span>
              </Tooltip>
            </th>
            {showTeamBudgets && (
              <th className="pb-2 text-right font-normal">
                <Tooltip content="Budsjett tildelt dette teamet fra organisasjonens totale budsjett, omregnet til NOK.">
                  <span className="cursor-help underline decoration-dotted underline-offset-2">Tildelt</span>
                </Tooltip>
              </th>
            )}
            {showTeamBudgets && (
              <th className="pb-2 pl-4 font-normal">
                <Tooltip content="Forbruk delt på tildelt budsjett. Grønn &lt;75 %, gul 75–90 %, oransje 90–100 %, rød over 100 %.">
                  <span className="cursor-help underline decoration-dotted underline-offset-2 flex items-center gap-1">
                    Utnyttelse <ArrowUpDown size={10} />
                  </span>
                </Tooltip>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const modelBreakdown = Object.entries(row.creditsByModel)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .map(([modelId, credits]) => ({
                label: MODELS[modelId as keyof typeof MODELS]?.label ?? modelId,
                credits: credits ?? 0,
                tokens: row.tokensByModel[modelId as keyof typeof row.tokensByModel] ?? 0,
              }))

            return (
              <tr key={row.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                <td className="py-2.5 font-medium text-gray-200">{row.name}</td>
                <td className="py-2.5 text-gray-400">{row.manager?.name ?? '—'}</td>
                <td className="py-2.5 text-right text-gray-400">{row.members}</td>
                <td className="py-2.5 text-right font-mono text-gray-300">
                  <Tooltip
                    content={
                      <div className="flex flex-col gap-1">
                        <span>Rå forbruk: {formatTokens(row.spentTokens)} tokens / {formatCredits(row.spentCredits)}</span>
                        {modelBreakdown.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5 border-t border-surface-border pt-1 text-gray-400">
                            {modelBreakdown.map(m => (
                              <span key={m.label}>{m.label}: {formatTokens(m.tokens)} tokens / {formatCredits(m.credits)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                  >
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      {formatNok(creditsToNok(row.spentCredits))}
                    </span>
                  </Tooltip>
                </td>
                {showTeamBudgets && (
                  <td className="py-2.5 text-right font-mono text-gray-500">{formatNok(creditsToNok(row.allocatedCredits))}</td>
                )}
                {showTeamBudgets && (
                  <td className="py-2.5 pl-4">
                    <UtilizationBar pct={row.pct} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </SectionCard>
  )
}
