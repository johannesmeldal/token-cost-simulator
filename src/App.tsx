import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useOrgStore } from './store/useOrgStore'
import { useGovernanceStore } from './store/useGovernanceStore'
import Shell from './components/layout/Shell'
import OrgAdminView from './views/OrgAdminView/index'
import TeamAdminView from './views/TeamAdminView'
import DeveloperView from './views/DeveloperView'

export default function App() {
  const loadAll = useOrgStore(s => s.loadAll)
  const organization = useOrgStore(s => s.organization)
  const loadPolicy = useGovernanceStore(s => s.loadPolicy)
  const isLoading = useOrgStore(s => s.isLoading)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (organization) {
      loadPolicy(organization.id)
    }
  }, [organization, loadPolicy])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-gray-400">
        <div className="text-sm">Laster inn data…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RoleRouter />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

function RoleRouter() {
  const role = useGovernanceStore(s => s.activeIdentity.role)

  if (role === 'org_admin') return <OrgAdminView />
  if (role === 'team_admin') return <TeamAdminView />
  return <DeveloperView />
}
