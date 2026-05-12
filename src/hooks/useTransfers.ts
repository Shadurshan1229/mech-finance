import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { TransferWithRefs } from '@/types'

type TransferInput = {
  amount:          number
  date:            string
  notes?:          string | null
  from_account_id?: string | null
  from_card_id?:   string | null
  to_account_id?:  string | null
  to_card_id?:     string | null
  to_goal_id?:     string | null
}

/**
 * Hook for all transfer types: withdraw cash, account transfer, pay card, fund goal.
 * Every mutation invalidates accounts, credit_cards, goals, and transactions.
 */
export function useTransfers() {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ['accounts',     userId] })
    qc.invalidateQueries({ queryKey: ['credit_cards', userId] })
    qc.invalidateQueries({ queryKey: ['goals',        userId] })
    qc.invalidateQueries({ queryKey: ['transactions', userId] })
  }

  const createTransfer = useMutation({
    mutationFn: async (input: TransferInput) => {
      const { error } = await supabase
        .from('transfers')
        .insert({ ...input, user_id: userId })
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  /** Withdraw cash: bank/ewallet → cash account */
  const withdrawCash = useMutation({
    mutationFn: async (input: { from_account_id: string; to_account_id: string; amount: number; date: string; notes?: string | null }) => {
      const { error } = await supabase
        .from('transfers')
        .insert({ ...input, user_id: userId })
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  /** Transfer: account → account */
  const transferBetweenAccounts = useMutation({
    mutationFn: async (input: { from_account_id: string; to_account_id: string; amount: number; date: string; notes?: string | null }) => {
      const { error } = await supabase
        .from('transfers')
        .insert({ ...input, user_id: userId })
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  /** Pay card: account → credit card */
  const payCard = useMutation({
    mutationFn: async (input: { from_account_id: string; to_card_id: string; amount: number; date: string; notes?: string | null }) => {
      const { error } = await supabase
        .from('transfers')
        .insert({ ...input, user_id: userId })
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  /** Fund goal: account → goal */
  const fundGoal = useMutation({
    mutationFn: async (input: { from_account_id: string; to_goal_id: string; amount: number; date: string; notes?: string | null }) => {
      const { error } = await supabase
        .from('transfers')
        .insert({ ...input, user_id: userId })
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  return {
    createTransfer,
    withdrawCash,
    transferBetweenAccounts,
    payCard,
    fundGoal,
  }
}

/** Query hook — fetches all transfers for the current user, newest first, with joined names. */
export function useTransferHistory() {
  const userId = useAppStore((s) => s.user?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_account:from_account_id(id, name, type),
          to_account:to_account_id(id, name, type),
          to_card:to_card_id(id, name),
          to_goal:to_goal_id(id, name)
        `)
        .eq('user_id', userId!)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as TransferWithRefs[]
    },
    enabled: !!userId,
  })

  return { transfers: data ?? [], isLoading }
}
