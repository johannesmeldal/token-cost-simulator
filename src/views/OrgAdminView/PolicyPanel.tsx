import SectionCard from '../../components/dashboard/SectionCard'
import { useGovernanceStore } from '../../store/useGovernanceStore'
import { useOrgStore } from '../../store/useOrgStore'

interface ToggleRowProps {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-surface-border/50 last:border-0">
      <div>
        <div className="text-sm text-gray-200">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${value ? 'bg-accent-blue' : 'bg-surface-border'}`}
      >
        <span className={`inline-block h-4 w-4 translate-y-0.5 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function PolicyPanel() {
  const { policy, setBudgetStructure, setEnforcement, setChargeback, setTransparency } = useGovernanceStore()
  const { organization } = useOrgStore()
  const orgId = organization?.id ?? ''

  return (
    <div className="grid grid-cols-2 gap-4">
      <SectionCard title="Budsjettstruktur" subtitle="Lag 1 — Hvor sitter budsjettet?">
        <ToggleRow
          label="Kun org-budsjett"
          description="Én felles pott, ingen team- eller individgrenser"
          value={policy.budgetStructure.orgBudgetOnly}
          onChange={v => setBudgetStructure(orgId, { orgBudgetOnly: v })}
        />
        <ToggleRow
          label="Teambudsjetter"
          description="Org-budsjett fordeles til hvert team"
          value={policy.budgetStructure.teamBudgets}
          onChange={v => setBudgetStructure(orgId, { teamBudgets: v })}
        />
        <ToggleRow
          label="Individuelle kvoter"
          description="Hver bruker får en personlig kvotegrense"
          value={policy.budgetStructure.individualQuotas}
          onChange={v => setBudgetStructure(orgId, { individualQuotas: v })}
        />

        <div className="mt-4 border-t border-surface-border pt-4">
          <div className="mb-2 text-xs text-gray-500 uppercase tracking-wider">Håndhevelse — Lag 2</div>
          <div className="flex gap-2">
            {(['soft', 'hard'] as const).map(m => (
              <button
                key={m}
                onClick={() => setEnforcement(orgId, m)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${policy.enforcement === m ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-surface-border text-gray-400 hover:border-gray-500'}`}
              >
                {m === 'soft' ? 'Soft Limits' : 'Hard Limits'}
                <div className="text-xs mt-0.5 font-normal opacity-70">
                  {m === 'soft' ? 'Advarer, blokkerer ikke' : 'Stopper ved grense'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-surface-border pt-4">
          <div className="mb-2 text-xs text-gray-500 uppercase tracking-wider">Chargeback — Lag 3</div>
          <div className="flex gap-2">
            {(['disabled', 'team', 'individual'] as const).map(m => (
              <button
                key={m}
                onClick={() => setChargeback(orgId, m)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${policy.chargeback === m ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-surface-border text-gray-400 hover:border-gray-500'}`}
              >
                {m === 'disabled' ? 'Av' : m === 'team' ? 'Team' : 'Individuell'}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personvern og synlighet" subtitle="Lag 4 — Hvem kan se hva?">
        <ToggleRow
          label="Org Admin ser individuelle navn"
          description="Vis navngitte brukere i org-dashbordet"
          value={policy.transparency.showIndividualToOrgAdmin}
          onChange={v => setTransparency(orgId, { showIndividualToOrgAdmin: v })}
        />
        <ToggleRow
          label="Team Admin ser individuelle navn"
          description="Vis navngitte teammedlemmer for Team Admin"
          value={policy.transparency.showIndividualToTeamAdmin}
          onChange={v => setTransparency(orgId, { showIndividualToTeamAdmin: v })}
        />
        <ToggleRow
          label="Anonymiser for Team Admin"
          description="Team Admin ser 'Bruker A/B/C' i stedet for navn"
          value={policy.transparency.anonymizationForTeamAdmin}
          onChange={v => setTransparency(orgId, { anonymizationForTeamAdmin: v })}
        />
        <ToggleRow
          label="Developer ser kollegers forbruk"
          description="Vis andres individuelle tall i developer-visningen"
          value={policy.transparency.showIndividualToDeveloper}
          onChange={v => setTransparency(orgId, { showIndividualToDeveloper: v })}
        />
        <ToggleRow
          label="Developer ser kostnadsattribusjon"
          description="Vis NOK-kostnad for eget forbruk"
          value={policy.transparency.showChargebackToDeveloper}
          onChange={v => setTransparency(orgId, { showChargebackToDeveloper: v })}
        />
        <ToggleRow
          label="Vis prognoser"
          description="Aktiver fremskrivingsmodul i alle dashboards"
          value={policy.transparency.showForecast}
          onChange={v => setTransparency(orgId, { showForecast: v })}
        />
      </SectionCard>
    </div>
  )
}
