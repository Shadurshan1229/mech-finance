import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { Menu, LogOut, Plus } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import QuickAddDialog, { useQuickAddShortcut } from '@/components/forms/QuickAddDialog'

interface TopbarProps {
  user: User
}

/** App topbar — MECH logo left, quick-add CTA center-right, user actions right. 48px tall. */
export default function Topbar({ user }: TopbarProps) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const [dialogOpen, setDialogOpen] = useState(false)

  useQuickAddShortcut(() => setDialogOpen(true))

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
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

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-mech-dark flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-mech-paper text-xs font-bold">M</span>
            </div>
            <span className="font-grotesk font-bold text-display-sm text-mech-dark tracking-tight">
              MECH <span className="text-mech-ink-50 font-medium">Finance</span>
            </span>
          </div>
        </div>

        {/* Right — add transaction CTA + user */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mech-orange text-white font-grotesk font-medium text-xs tracking-[0.01em] border-2 border-mech-orange rounded-none hover:opacity-90 transition-opacity duration-fast"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Transaction
          </button>

          <span className="font-mono text-mono-sm text-mech-ink-50 uppercase tracking-[0.08em] hidden sm:block">
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

      <QuickAddDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
