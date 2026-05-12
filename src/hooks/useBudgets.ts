import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { computeBudgetRemaining, getMonthRange } from '@/lib/utils'
import type { Budget, BudgetWithCategory, Category } from '@/types'

type UpsertBudgetInput = {
  category_id: string
  month: string
  amount: number
  rollover: boolean
}

/**
 * Hook for budget operations for a given month.
 * Fetches budgets joined with categories, computes actual spend per category.
 * Upsert uses ON CONFLICT (user_id, category_id, month).
 */
export function useBudgets(month: Date) {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  const monthKey = format(startOfMonth(month), 'yyyy-MM-dd')
  const { start, end } = getMonthRange(month)

  const query = useQuery({
    queryKey: ['budgets', userId, monthKey],
    enabled:  !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    queryFn:  async (): Promise<BudgetWithCategory[]> => {
      const [budgetRes, catRes] = await Promise.all([
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userId!)
          .eq('month', monthKey),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId!)
          .eq('type', 'expense'),
      ])
      if (budgetRes.error) throw budgetRes.error
      if (catRes.error)    throw catRes.error

      const budgets:    Budget[]   = budgetRes.data
      const categories: Category[] = catRes.data

      // Compute actual spend per expense category for the month
      const spendRes = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', userId!)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end)

      const spendMap: Record<string, number> = {}
      for (const tx of spendRes.data ?? []) {
        if (tx.category_id) {
          spendMap[tx.category_id] = (spendMap[tx.category_id] ?? 0) + Number(tx.amount)
        }
      }

      // Build result: only categories that have a budget this month
      return budgets.map((b) => {
        const category = categories.find((c) => c.id === b.category_id)
        const spent    = spendMap[b.category_id] ?? 0
        return { ...b, category, spent }
      })
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['budgets', userId, monthKey] })

  const upsertBudget = useMutation({
    mutationFn: async (input: UpsertBudgetInput) => {
      const { error } = await supabase
        .from('budgets')
        .upsert(
          { ...input, user_id: userId },
          { onConflict: 'user_id,category_id,month' }
        )
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  /** Copies all budgets from the previous month into the current month (skips existing). */
  const copyFromLastMonth = useMutation({
    mutationFn: async () => {
      const prevDate   = new Date(month)
      prevDate.setMonth(prevDate.getMonth() - 1)
      const prevKey    = format(startOfMonth(prevDate), 'yyyy-MM-dd')

      const { data: prevBudgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId!)
        .eq('month', prevKey)
      if (error) throw error
      if (!prevBudgets?.length) return

      const rows = prevBudgets.map((b: Budget) => ({
        user_id:     userId,
        category_id: b.category_id,
        month:       monthKey,
        amount:      b.amount,
        rollover:    b.rollover,
      }))

      const { error: insertError } = await supabase
        .from('budgets')
        .upsert(rows, { onConflict: 'user_id,category_id,month', ignoreDuplicates: true })
      if (insertError) throw insertError
    },
    onSuccess: invalidate,
  })

  const totalBudgeted = (query.data ?? []).reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent    = (query.data ?? []).reduce((s, b) => s + (b.spent ?? 0), 0)
  const totalRemaining = computeBudgetRemaining(totalBudgeted, totalSpent)

  return {
    budgets:      query.data ?? [],
    totalBudgeted,
    totalSpent,
    totalRemaining,
    isLoading:    query.isLoading,
    upsertBudget,
    deleteBudget,
    copyFromLastMonth,
  }
}

/** Fetches all expense categories (for the budget-setting sheet). */
export async function fetchExpenseCategories(userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .in('type', ['expense', 'both'])
    .order('name')
  if (error) throw error
  return data as Category[]
}
