import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { Menu, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface TopbarProps {
  user: User
}

/** App topbar — MECH logo left, user actions right. 48px tall. */
export default function Topbar({ user }: TopbarProps) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-mech-paper border-b border-mech-ink-20 flex-shrink-0">
      {/* Left — menu toggle + wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="w-8 h-8 flex items-center justify-center text-mech-ink-80 hover:text-mech-dark transition-colors duration-instant"
        >
          <Menu size={16} strokeWidth={1.5} />
        </button>

        {/* MECH logo wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-mech-dark flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-mech-paper text-xs font-bold">M</span>
          </div>
          <span className="font-grotesk font-bold text-display-sm text-mech-dark tracking-tight">
            MECH <span className="text-mech-ink-50 font-medium">Finance</span>
          </span>
        </div>
      </div>

      {/* Right — user email + sign out */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-mono-sm text-mech-ink-50 uppercase tracking-[0.08em]">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="w-8 h-8 flex items-center justify-center text-mech-ink-80 hover:text-mech-signal-red transition-colors duration-instant"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}
