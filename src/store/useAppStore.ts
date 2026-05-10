import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

/** UI-only state. Server data lives in hooks, not here. */
interface AppState {
  user: User | null
  sessionLoaded: boolean
  setUser: (user: User | null) => void
  setSessionLoaded: (loaded: boolean) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  sessionLoaded: false,
  setUser: (user) => set({ user }),
  setSessionLoaded: (loaded) => set({ sessionLoaded: loaded }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
