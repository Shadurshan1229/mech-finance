import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { computeAccountBalance } from '@/lib/utils'
import type { Account } from '@/types'

export interface AccountWithBalance extends Account {
  balance: number
}

type CreateAccountInput = Pick<Account, 'name' | 'type' | 'initial_amount'> & {
  color?: string | null
  icon?:  string | null
}
type UpdateAccountInput = Partial<CreateAccountInput> & { id: string }

/**
 * Hook for all account operations.
 * Fetches accounts for the current user with computed balance.
 * All mutations invalidate ['accounts', userId].
 */
export function useAccounts() {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['accounts', userId],
    enabled:  !!userId,
    queryFn:  async (): Promise<AccountWithBalance[]> => {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Compute live balance for each account
      const withBalances = await Promise.all(
        accounts.map(async (account: Account) => {
          const [incomeRes, expenseRes, transferInRes, transferOutRes] = await Promise.all([
            supabase
              .from('transactions')
              .select('amount')
              .eq('account_id', account.id)
              .eq('type', 'income'),
            supabase
              .from('transactions')
              .select('amount')
              .eq('account_id', account.id)
              .eq('type', 'expense'),
            supabase
              .from('transfers')
              .select('amount')
              .eq('to_account_id', account.id),
            supabase
              .from('transfers')
              .select('amount')
              .eq('from_account_id', account.id),
          ])

          const sum = (rows: { amount: number }[] | null) =>
            (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)

          const balance = computeAccountBalance({
            initialAmount: Number(account.initial_amount),
            income:        sum(incomeRes.data),
            expense:       sum(expenseRes.data),
            transferIn:    sum(transferInRes.data),
            transferOut:   sum(transferOutRes.data),
          })

          return { ...account, balance }
        })
      )

      return withBalances
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounts', userId] })

  const createAccount = useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      const { error } = await supabase
        .from('accounts')
        .insert({ ...input, user_id: userId, currency: 'LKR', is_active: true })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...input }: UpdateAccountInput) => {
      const { error } = await supabase
        .from('accounts')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const archiveAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const restoreAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const activeAccounts   = query.data?.filter((a) => a.is_active)   ?? []
  const archivedAccounts = query.data?.filter((a) => !a.is_active)   ?? []
  const totalBalance     = activeAccounts.reduce((s, a) => s + a.balance, 0)

  return {
    accounts:        query.data ?? [],
    activeAccounts,
    archivedAccounts,
    totalBalance,
    isLoading:       query.isLoading,
    createAccount,
    updateAccount,
    archiveAccount,
    restoreAccount,
  }
}
