import Topbar from './Topbar'
import Sidebar from './Sidebar'
import type { User } from '@supabase/supabase-js'

interface ShellProps {
  user: User
  children: React.ReactNode
}

/** App shell — Topbar + Sidebar + scrollable content area. */
export default function Shell({ user, children }: ShellProps) {
  return (
    <div className="h-screen flex flex-col bg-mech-paper overflow-hidden">
      <Topbar user={user} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
