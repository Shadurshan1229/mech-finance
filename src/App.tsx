import { useEffect, useCallback } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Session } from '@supabase/supabase-js'

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining',   type: 'expense', icon: 'utensils',       color: '#E74C3C' },
  { name: 'Transport',       type: 'expense', icon: 'car',            color: '#E67E22' },
  { name: 'Shopping',        type: 'expense', icon: 'shopping-bag',   color: '#9B59B6' },
  { name: 'Utilities',       type: 'expense', icon: 'zap',            color: '#3498DB' },
  { name: 'Health',          type: 'expense', icon: 'heart-pulse',    color: '#2ECC71' },
  { name: 'Entertainment',   type: 'expense', icon: 'clapperboard',   color: '#F39C12' },
  { name: 'Education',       type: 'expense', icon: 'graduation-cap', color: '#1ABC9C' },
  { name: 'Rent & Housing',  type: 'expense', icon: 'home',           color: '#34495E' },
  { name: 'Personal Care',   type: 'expense', icon: 'sparkles',       color: '#E91E63' },
  { name: 'Miscellaneous',   type: 'expense', icon: 'circle-ellipsis',color: '#95A5A6' },
] as const

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary',             type: 'income', icon: 'briefcase',   color: '#2ECC71' },
  { name: 'Freelance',          type: 'income', icon: 'laptop',      color: '#27AE60' },
  { name: 'Business',           type: 'income', icon: 'building-2',  color: '#16A085' },
  { name: 'Investment Returns', type: 'income', icon: 'trending-up', color: '#FF5B24' },
  { name: 'Gift',               type: 'income', icon: 'gift',        color: '#8E44AD' },
  { name: 'Other Income',       type: 'income', icon: 'plus-circle', color: '#7F8C8D' },
] as const

async function seedDefaultCategories(userId: string) {
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) > 0) return

  const rows = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
  ].map((c) => ({ ...c, user_id: userId, is_default: true }))

  await supabase.from('categories').insert(rows)
}

/** Root component — manages auth session, drives router and store. */
export default function App() {
  const setUser = useAppStore((s) => s.setUser)
  const setSessionLoaded = useAppStore((s) => s.setSessionLoaded)

  const handleSession = useCallback(async (session: Session | null) => {
    setUser(session?.user ?? null)
    setSessionLoaded(true)
    if (session?.user) {
      await seedDefaultCategories(session.user.id)
    }
  }, [setUser, setSessionLoaded])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => handleSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [handleSession])

  return <RouterProvider router={router} />
}
