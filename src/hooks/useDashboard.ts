import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { computeNetWorth } from '@/lib/utils'
import type { IncomeExpenseBarData } from '@/components/charts/IncomeExpenseBar'
import type { SpendingTrendData } from '@/components/charts/SpendingTrend'
import type { CategoryDonutData } from '@/components/charts/CategoryDonut'
import type { NetWorthLineData } from '@/components/charts/NetWorthLine'

export type RecentTransaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string
  category: { id: string; name: string; color: string } | null
}

/**
 * Hook that fetches and aggregates chart data for the Dashboard.
 * Keeps heavy queries out of the page component.
 */
export function useDashboardCharts() {
  const userId = useAppStore((s) => s.user?.id)

  const todayStr       = format(new Date(), 'yyyy-MM-dd')
  const monthStartStr  = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const sixMoAgoStr    = format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd')
  const thirtyDaysAgoStr = format(subDays(new Date(), 29), 'yyyy-MM-dd')

  // ── All transactions for last 6 months (income/expense + spending trend) ──
  const { data: txRaw, isLoading: txLoading } = useQuery({
    queryKey: ['dash-tx', userId, sixMoAgoStr],
    enabled:  !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', userId!)
        .gte('date', sixMoAgoStr)
        .lte('date', todayStr)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Transactions with categories for current month ──────────────────────
  const { data: catRaw } = useQuery({
    queryKey: ['dash-cat', userId, monthStartStr],
    enabled:  !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, category:categories(id, name, color)')
        .eq('user_id', userId!)
        .eq('type', 'expense')
        .gte('date', monthStartStr)
        .lte('date', todayStr)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Recent transactions (last 8) ─────────────────────────────────────────
  const { data: recentTxRaw } = useQuery({
    queryKey: ['dash-recent-tx', userId],
    enabled:  !!userId,
    staleTime: 1 * 60 * 1000,
    queryFn:  async (): Promise<RecentTransaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, date, description, category:categories(id, name, color)')
        .eq('user_id', userId!)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8)
      if (error) throw error
      return (data ?? []) as unknown as RecentTransaction[]
    },
  })

  // ── Portfolio snapshots (for net worth) ──────────────────────────────────
  const { data: portfolioRaw } = useQuery({
    queryKey: ['dash-portfolio', userId],
    enabled:  !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn:  async () => {
      const [assetsRes, liabRes] = await Promise.all([
        supabase
          .from('portfolio_asset_snapshots')
          .select('asset_id, value, date')
          .order('date', { ascending: false }),
        supabase
          .from('portfolio_liability_snapshots')
          .select('liability_id, balance, date')
          .order('date', { ascending: false }),
      ])
      return {
        assets:      assetsRes.data ?? [],
        liabilities: liabRes.data   ?? [],
      }
    },
  })

  // ── Derived: Income vs Expense (last 6 months) ───────────────────────────
  const incomeExpenseData = useMemo((): IncomeExpenseBarData[] => {
    const rows = txRaw ?? []
    return Array.from({ length: 6 }, (_, i) => {
      const month   = subMonths(new Date(), 5 - i)
      const key     = format(month, 'yyyy-MM')
      const filtered = rows.filter((t) => t.date.startsWith(key))
      return {
        month:   format(month, 'MMM'),
        income:  filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      }
    })
  }, [txRaw])

  // ── Derived: Daily spending trend (last 30 days) ─────────────────────────
  const spendingTrendData = useMemo((): SpendingTrendData[] => {
    const rows = (txRaw ?? []).filter((t) => t.type === 'expense' && t.date >= thirtyDaysAgoStr)
    return Array.from({ length: 30 }, (_, i) => {
      const day    = subDays(new Date(), 29 - i)
      const dayStr = format(day, 'yyyy-MM-dd')
      return {
        date:    format(day, 'dd MMM'),
        amount:  rows.filter((t) => t.date === dayStr).reduce((s, t) => s + Number(t.amount), 0),
        isToday: dayStr === todayStr,
      }
    })
  }, [txRaw, thirtyDaysAgoStr, todayStr])

  // ── Derived: Category breakdown (current month) ──────────────────────────
  const categoryData = useMemo((): CategoryDonutData[] => {
    const groups: Record<string, CategoryDonutData> = {}
    ;(catRaw ?? []).forEach((t) => {
      const cat  = t.category as unknown as { name: string; color: string } | null
      const name  = cat?.name  ?? 'Uncategorized'
      const color = cat?.color ?? '#95A5A6'
      if (!groups[name]) groups[name] = { name, value: 0, color }
      groups[name].value += Number(t.amount)
    })
    return Object.values(groups).sort((a, b) => b.value - a.value)
  }, [catRaw])

  // ── Derived: Net worth ───────────────────────────────────────────────────
  const { netWorth, netWorthDelta, hasPortfolioData, netWorthTrendData } = useMemo(() => {
    const { assets = [], liabilities = [] } = portfolioRaw ?? {}

    if (assets.length === 0 && liabilities.length === 0) {
      return { netWorth: 0, netWorthDelta: 0, hasPortfolioData: false, netWorthTrendData: [] }
    }

    // Latest snapshot per asset/liability
    const latestAsset = new Map<string, number>()
    assets.forEach((s) => { if (!latestAsset.has(s.asset_id)) latestAsset.set(s.asset_id, Number(s.value)) })
    const latestLiab = new Map<string, number>()
    liabilities.forEach((s) => { if (!latestLiab.has(s.liability_id)) latestLiab.set(s.liability_id, Number(s.balance)) })

    const netWorth    = computeNetWorth([...latestAsset.values()], [...latestLiab.values()])

    // Last month net worth (snapshots from last month)
    const lmStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
    const lmEnd   = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')

    const lmAssets = new Map<string, number>()
    assets.filter((s) => s.date >= lmStart && s.date <= lmEnd)
          .forEach((s) => { if (!lmAssets.has(s.asset_id)) lmAssets.set(s.asset_id, Number(s.value)) })
    const lmLiabs = new Map<string, number>()
    liabilities.filter((s) => s.date >= lmStart && s.date <= lmEnd)
               .forEach((s) => { if (!lmLiabs.has(s.liability_id)) lmLiabs.set(s.liability_id, Number(s.balance)) })

    const lmNetWorth  = computeNetWorth([...lmAssets.values()], [...lmLiabs.values()])
    const netWorthDelta = lmAssets.size > 0 || lmLiabs.size > 0 ? netWorth - lmNetWorth : 0

    // Trend: last 6 months
    const netWorthTrendData: NetWorthLineData[] = Array.from({ length: 6 }, (_, i) => {
      const month     = subMonths(new Date(), 5 - i)
      const mEnd      = format(endOfMonth(month), 'yyyy-MM-dd')
      const aMap = new Map<string, number>()
      assets.filter((s) => s.date <= mEnd).forEach((s) => { if (!aMap.has(s.asset_id)) aMap.set(s.asset_id, Number(s.value)) })
      const lMap = new Map<string, number>()
      liabilities.filter((s) => s.date <= mEnd).forEach((s) => { if (!lMap.has(s.liability_id)) lMap.set(s.liability_id, Number(s.balance)) })
      const a = Array.from(aMap.values()).reduce((s, v) => s + v, 0)
      const l = Array.from(lMap.values()).reduce((s, v) => s + v, 0)
      return { month: format(month, 'MMM yyyy'), netWorth: a - l, assets: a, liabilities: l }
    })

    return { netWorth, netWorthDelta, hasPortfolioData: true, netWorthTrendData }
  }, [portfolioRaw])

  return {
    incomeExpenseData,
    spendingTrendData,
    categoryData,
    netWorth,
    netWorthDelta,
    hasPortfolioData,
    netWorthTrendData,
    recentTransactions: recentTxRaw ?? [],
    isLoading: txLoading,
  }
}
