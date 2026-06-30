import { useState } from 'react'
import { LayoutDashboard, Settings, Activity } from 'lucide-react'
import { useSimulation } from '../../hooks/useSimulation'
import OrgBudgetSection from './OrgBudgetSection'
import TeamOverviewSection from './TeamOverviewSection'
import UserOverviewSection from './UserOverviewSection'
import PolicyPanel from './PolicyPanel'
import SectionCard from '../../components/dashboard/SectionCard'
import LiveEventFeed from '../../components/dashboard/LiveEventFeed'

type Tab = 'dashboard' | 'policies' | 'events'

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'policies', label: 'Governance-policyer', icon: Settings },
  { id: 'events', label: 'Live hendelser', icon: Activity },
]

export default function OrgAdminView() {
  useSimulation()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className="flex flex-col gap-5">
      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-surface-border pb-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 pb-3 text-sm transition-colors ${
              activeTab === id
                ? 'border-accent-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-4">
          <OrgBudgetSection />
          <TeamOverviewSection />
          <UserOverviewSection />
        </div>
      )}

      {activeTab === 'policies' && <PolicyPanel />}

      {activeTab === 'events' && (
        <SectionCard title="Live hendelser" subtitle="Siste 100 hendelser fra simuleringen">
          <LiveEventFeed maxItems={100} />
        </SectionCard>
      )}
    </div>
  )
}
