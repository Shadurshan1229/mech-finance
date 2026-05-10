import { Outlet, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import Shell from './Shell'

/** Protected layout route — shows loader until session resolves, then gates on auth. */
export default function AppLayout() {
  const user = useAppStore((s) => s.user)
  const sessionLoaded = useAppStore((s) => s.sessionLoaded)

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-mech-paper flex items-center justify-center">
        <span className="font-mono text-mono-sm uppercase tracking-[0.12em] text-mech-ink-50">
          Loading...
        </span>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return (
    <Shell user={user}>
      <Outlet />
    </Shell>
  )
}
