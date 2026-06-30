import type { ReactNode } from 'react'
import TopBar from './TopBar'

interface ShellProps {
  children: ReactNode
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
