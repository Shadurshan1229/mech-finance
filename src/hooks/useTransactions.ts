import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { getMonthRange } from '@/lib/utils'
import type { Transaction, Category, Account, CreditCard } from '@/types'

export interface TransactionFilters {
  month?:        Date
  type?:         'income' | 'expense' | ''
  categoryId?:   string
  accountId?:    string
  creditCardId?: string
  search?:       string
}

export interface TransactionWithRefs extends Transaction {
  category?:    Category
  account?:     Account
  credit_card?: CreditCard
}

export interface TransactionSummary {
  income:  number
  expense: number
  net:     number
}

const PAGE_SIZE = 50

type UpdateTransactionInput = Partial<Pick<
  Transaction,
  'type' | 'amount' | 'date' | 'description' | 'category_id' |
  'account_id' | 'credit_card_id' | 'occasion' | 'notes'
>> & { id: string }

/**
 * Hook for transaction operations.
 * Default filter: current month. Supports filtering by type, category, account, date range, search.
 * Mutations invalidate transactions and accounts query keys.
 */
export function useTransactions(filters: TransactionFilters = {}, page = 0) {
  const userId = useAppStore((s) => s.user?.id)
  const qc     = useQueryClient()

  const effectiveMonth = filters.month ?? new Date()
  const { start, end } = getMonthRange(effectiveMonth)

  const query = useQuery({
    queryKey: ['transactions', userId, { start, end, ...filters, page }],
    enabled:  !!userId,
    queryFn:  async () => {
      let q = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(*),
          credit_card:credit_cards(*)
        `)
        .eq('user_id', userId!)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.type)        q = q.eq('type', filters.type)
      if (filters.categoryId)  q = q.eq('category_id', filters.categoryId)
      if (filters.accountId)   q = q.eq('account_id', filters.accountId)
      if (filters.creditCardId) q = q.eq('credit_card_id', filters.creditCardId)
      if (filters.search)      q = q.ilike('description', `%${filters.search}%`)

      const { data, error, count } = await q
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      return { transactions: (data ?? []) as TransactionWithRefs[], total: count ?? 0 }
    },
  })

  // Summary query (all matching rows without pagination)
  const summaryQuery = useQuery({
    queryKey: ['transactions-summary', userId, { start, end, ...filters }],
    enabled:  !!userId,
    queryFn:  async (): Promise<TransactionSummary> => {
      let q = supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId!)
        .gte('date', start)
        .lte('date', end)

      if (filters.type)        q = q.eq('type', filters.type)
      if (filters.categoryId)  q = q.eq('category_id', filters.categoryId)
      if (filters.accountId)   q = q.eq('account_id', filters.accountId)
      if (filters.search)      q = q.ilike('description', `%${filters.search}%`)

      const { data, error } = await q
      if (error) throw error

      const rows = (data ?? []) as { type: string; amount: number }[]
      const income  = rows.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
      const expense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
      return { income, expense, net: income - expense }
    },
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['transactions', userId] })
    qc.invalidateQueries({ queryKey: ['transactions-summary', userId] })
    qc.invalidateQueries({ queryKey: ['accounts', userId] })
  }

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  return {
    transactions: query.data?.transactions ?? [],
    total:        query.data?.total ?? 0,
    summary:      summaryQuery.data ?? { income: 0, expense: 0, net: 0 },
    isLoading:    query.isLoading,
    updateTransaction,
    deleteTransaction,
    PAGE_SIZE,
  }
}
