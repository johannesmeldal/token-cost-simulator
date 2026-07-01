import { useState } from 'react'
import { Eye, EyeOff, Ban } from 'lucide-react'
import SectionCard from '../../components/dashboard/SectionCard'
import Tooltip from '../../components/dashboard/Tooltip'
import { useOrgStore } from '../../store/useOrgStore'
import { useGovernanceStore } from '../../store/useGovernanceStore'
import { creditsToNok, formatNok, formatCredits, formatTokens } from '../../utils/cost'
import { MODELS } from '../../data/pricing'

const EMPTY_USAGE = {
  spentTokens: 0,
  spentCredits: 0,
  overflowCredits: 0,
  tokensByModel: {},
  creditsByModel: {},
  isBlocked: false,
}

const profileLabel: Record<string, string> = {
  normal_developer: 'Normal',
  power_user: 'Power User',
  intern: 'Intern',
  experimental_user: 'Experimental',
}

const profileColor: Record<string, string> = {
  normal_developer: 'text-accent-blue',
  power_user: 'text-accent-purple',
  intern: 'text-gray-500',
  experimental_user: 'text-accent-orange',
}

export default function UserOverviewSection() {
  const [showNames, setShowNames] = useState(true)
  const { users, teams, userUsage } = useOrgStore()
  const { policy } = useGovernanceStore()

  const showIndividual = policy.transparency.showIndividualToOrgAdmin
  const showQuota = policy.budgetStructure.individualQuotas

  const rows = users
    .filter(u => u.role !== 'org_admin')
    .map((u, i) => {
      const usage = userUsage[u.id] ?? EMPTY_USAGE
      const team = teams.find(t => t.id === u.teamId)
      const pct = showQuota && u.quotaCredits > 0 ? usage.spentCredits / u.quotaCredits : null
      const displayName = showNames && showIndividual ? u.name : `Bruker ${String.fromCharCode(65 + (i % 26))}`
      return { ...u, usage, team, pct, displayName }
    })
    .sort((a, b) => b.usage.spentCredits - a.usage.spentCredits)

  return (
    <SectionCard
      title="Brukeroversikt"
      subtitle={`${rows.length} brukere`}
      action={
        showIndividual ? (
          <button
            onClick={() => setShowNames(v => !v)}
            className="flex items-center gap-1.5 rounded border border-surface-border px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showNames ? <EyeOff size={12} /> : <Eye size={12} />}
            {showNames ? 'Anonymiser' : 'Vis navn'}
          </button>
        ) : undefined
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-xs text-gray-500">
            <th className="pb-2 text-left font-normal">Bruker</th>
            <th className="pb-2 text-left font-normal">Team</th>
            <th className="pb-2 text-left font-normal">
              <Tooltip content="Simulert bruksprofil: Normal, Power User, Intern eller Experimental. Styrer hvor mange tokens brukeren genererer per tick i simuleringen.">
                <span className="cursor-help underline decoration-dotted underline-offset-2">Profil</span>
              </Tooltip>
            </th>
            <th className="pb-2 text-right font-normal">
              <Tooltip content="Brukerens forbruk omregnet til NOK. Hold over verdien for å se rå tokens/kreditter og fordeling per modell.">
                <span className="cursor-help underline decoration-dotted underline-offset-2">Forbruk</span>
              </Tooltip>
            </th>
            {showQuota && (
              <th className="pb-2 text-right font-normal">
                <Tooltip content="Personlig kvote tildelt brukeren, omregnet til NOK. Settes av Org Admin eller Team Admin. Aktiveres kun når «Individuelle kvoter» er skrudd på.">
                  <span className="cursor-help underline decoration-dotted underline-offset-2">Kvote</span>
                </Tooltip>
              </th>
            )}
            {showQuota && (
              <th className="pb-2 pl-3 text-left font-normal">
                <Tooltip content="Forbruk delt på personlig kvote. Grønn &lt;75 %, gul 75–90 %, oransje 90–100 %, rød over 100 %.">
                  <span className="cursor-help underline decoration-dotted underline-offset-2">Utnyttelse</span>
                </Tooltip>
              </th>
            )}
            <th className="pb-2 text-center font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const modelBreakdown = Object.entries(row.usage.creditsByModel)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .map(([modelId, credits]) => ({
                label: MODELS[modelId as keyof typeof MODELS]?.label ?? modelId,
                credits: credits ?? 0,
                tokens: row.usage.tokensByModel[modelId as keyof typeof row.usage.tokensByModel] ?? 0,
              }))

            return (
              <tr key={row.id} className={`border-b border-surface-border/50 transition-colors ${row.usage.isBlocked ? 'opacity-50' : 'hover:bg-surface-hover'}`}>
                <td className="py-2 font-medium text-gray-200">{row.displayName}</td>
                <td className="py-2 text-gray-400">{row.team?.name ?? '—'}</td>
                <td className={`py-2 text-xs ${profileColor[row.simulationProfile]}`}>
                  {profileLabel[row.simulationProfile]}
                </td>
                <td className="py-2 text-right font-mono text-gray-300">
                  <Tooltip
                    content={
                      <div className="flex flex-col gap-1">
                        <span>Rå forbruk: {formatTokens(row.usage.spentTokens)} tokens / {formatCredits(row.usage.spentCredits)}</span>
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
                      {formatNok(creditsToNok(row.usage.spentCredits))}
                    </span>
                  </Tooltip>
                </td>
                {showQuota && (
                  <td className="py-2 text-right font-mono text-gray-500">{formatNok(creditsToNok(row.quotaCredits))}</td>
                )}
                {showQuota && row.pct !== null && (
                  <td className="py-2 pl-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-surface-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${row.pct >= 1 ? 'bg-accent-red' : row.pct >= 0.9 ? 'bg-accent-orange' : row.pct >= 0.75 ? 'bg-accent-yellow' : 'bg-accent-green'}`}
                          style={{ width: `${Math.min(row.pct * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-500">{(row.pct * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                )}
                <td className="py-2 text-center">
                  {row.usage.isBlocked
                    ? <span className="inline-flex items-center gap-1 text-xs text-accent-red"><Ban size={11} />Blokkert</span>
                    : <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" />
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </SectionCard>
  )
}
