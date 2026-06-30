import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Shield, Users, Code2 } from 'lucide-react'
import { useGovernanceStore } from '../../store/useGovernanceStore'
import { useOrgStore } from '../../store/useOrgStore'
import type { UserRole } from '../../types/org'

interface IdentityOption {
  role: UserRole
  userId: string
  teamId: string | null
  label: string
  sublabel: string
}

const roleIcon: Record<UserRole, typeof Shield> = {
  org_admin: Shield,
  team_admin: Users,
  developer: Code2,
}

const roleColor: Record<UserRole, string> = {
  org_admin: 'text-accent-purple',
  team_admin: 'text-accent-blue',
  developer: 'text-accent-green',
}

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { activeIdentity, setActiveIdentity } = useGovernanceStore()
  const { users, teams } = useOrgStore()

  // Build identity options from loaded data
  const options: IdentityOption[] = []

  const orgAdmins = users.filter(u => u.role === 'org_admin')
  orgAdmins.forEach(u => {
    options.push({ role: 'org_admin', userId: u.id, teamId: null, label: u.name, sublabel: 'Org Admin' })
  })

  const teamAdmins = users.filter(u => u.role === 'team_admin')
  teamAdmins.forEach(u => {
    const team = teams.find(t => t.id === u.teamId)
    options.push({ role: 'team_admin', userId: u.id, teamId: u.teamId, label: u.name, sublabel: `Team Admin — ${team?.name ?? 'Ukjent team'}` })
  })

  const developers = users.filter(u => u.role === 'developer')
  developers.forEach(u => {
    const team = teams.find(t => t.id === u.teamId)
    options.push({ role: 'developer', userId: u.id, teamId: u.teamId, label: u.name, sublabel: `Developer — ${team?.name ?? 'Ukjent team'}` })
  })

  const current = options.find(o => o.userId === activeIdentity.userId) ?? options[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!current) return null

  const Icon = roleIcon[current.role]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-sm hover:border-gray-500 transition-colors"
      >
        <Icon size={14} className={roleColor[current.role]} />
        <span className="font-medium">{current.label}</span>
        <span className="text-gray-500 text-xs">{current.sublabel}</span>
        <ChevronDown size={12} className="text-gray-500 ml-1" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-md border border-surface-border bg-surface-card shadow-xl">
          {(['org_admin', 'team_admin', 'developer'] as UserRole[]).map(role => {
            const group = options.filter(o => o.role === role)
            if (!group.length) return null
            const GroupIcon = roleIcon[role]
            return (
              <div key={role}>
                <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <GroupIcon size={11} className={roleColor[role]} />
                  {role === 'org_admin' ? 'Org Admin' : role === 'team_admin' ? 'Team Admin' : 'Developer'}
                </div>
                {group.map(opt => (
                  <button
                    key={opt.userId}
                    onClick={() => { setActiveIdentity(opt); setOpen(false) }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${opt.userId === activeIdentity.userId ? 'bg-surface-hover' : ''}`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-auto text-xs text-gray-500">{opt.sublabel.split('—')[1]?.trim()}</span>
                  </button>
                ))}
              </div>
            )
          })}
          <div className="h-2" />
        </div>
      )}
    </div>
  )
}
