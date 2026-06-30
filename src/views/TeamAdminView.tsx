import { Users } from 'lucide-react'
import { useGovernanceStore } from '../store/useGovernanceStore'
import { useOrgStore } from '../store/useOrgStore'

export default function TeamAdminView() {
  const { activeIdentity } = useGovernanceStore()
  const teams = useOrgStore(s => s.teams)
  const team = teams.find(t => t.id === activeIdentity.teamId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-accent-blue">
        <Users size={18} />
        <h1 className="text-lg font-semibold">Team Admin — {team?.name ?? 'Ukjent team'}</h1>
      </div>
      <p className="text-sm text-gray-400">Team-dashboard lastes inn her.</p>
    </div>
  )
}
