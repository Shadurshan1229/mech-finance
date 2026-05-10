import { NavLink } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { NAV_GROUPS } from '@/lib/constants'
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Wallet, CreditCard,
  Handshake, Target, Repeat, TrendingUp, Settings, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'arrow-left-right': ArrowLeftRight,
  'pie-chart':        PieChart,
  'wallet':           Wallet,
  'credit-card':      CreditCard,
  'handshake':        Handshake,
  'target':           Target,
  'repeat':           Repeat,
  'trending-up':      TrendingUp,
  'settings':         Settings,
}

/** App sidebar — full nav groups, active orange left border, MECH DS styled. */
export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'flex-shrink-0 flex flex-col bg-mech-paper-secondary border-r border-mech-ink-20 transition-all duration-base overflow-hidden',
        collapsed ? 'w-12' : 'w-60'
      )}
    >
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <div className="px-4 py-1.5 mt-3">
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-mech-ink-50">
                  {group.label}
                </span>
              </div>
            )}

            {group.items.map((item) => {
              const Icon = ICON_MAP[item.icon]
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-4 py-2 font-grotesk text-sm border-l-2 transition-colors duration-instant',
                      isActive
                        ? 'text-mech-dark font-medium border-mech-orange bg-mech-paper'
                        : 'text-mech-ink-80 border-transparent hover:text-mech-dark'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {Icon && (
                        <Icon
                          size={16}
                          strokeWidth={1.5}
                          className={cn(
                            'flex-shrink-0 transition-colors duration-instant',
                            isActive ? 'text-mech-orange' : 'text-mech-ink-50'
                          )}
                        />
                      )}
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
