import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { CreditDebt, CreditDebtPayment } from '@/types'

type CreateCreditDebtInput = {
  type:              'i_owe' | 'they_owe'
  person:            string
  amount:            number
  date:              string
  due_date?:         string | null
  reason?:           string | null
  linked_account_id?: string | null
}

type LogPaymentInput = {
  credit_debt_id: string
  amount:         number
  date:           string
  notes?:         string | null
}

/**
 * Hook for credits & debts operations.
 * Fetches all records; logPayment updates `remaining` and `status` in-place.
 */
export function useCreditsDebts() {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['credits_debts', userId],
    enabled:  !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    queryFn:  async (): Promise<CreditDebt[]> => {
      const { data, error } = await supabase
        .from('credits_debts')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['credits_debts', userId] })

  const createRecord = useMutation({
    mutationFn: async (input: CreateCreditDebtInput) => {
      const { error } = await supabase
        .from('credits_debts')
        .insert({
          ...input,
          user_id:   userId,
          remaining: input.amount,
          status:    'pending',
        })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const logPayment = useMutation({
    mutationFn: async (input: LogPaymentInput) => {
      // Fetch current record to calculate new remaining
      const { data: record, error: fetchErr } = await supabase
        .from('credits_debts')
        .select('remaining')
        .eq('id', input.credit_debt_id)
        .single()
      if (fetchErr) throw fetchErr

      const newRemaining = Math.max(0, Number(record.remaining) - input.amount)
      const newStatus: CreditDebt['status'] = newRemaining <= 0 ? 'settled' : 'partial'

      // Insert payment log
      const { error: payErr } = await supabase
        .from('credit_debt_payments')
        .insert({
          credit_debt_id: input.credit_debt_id,
          amount:         input.amount,
          date:           input.date,
          notes:          input.notes ?? null,
        })
      if (payErr) throw payErr

      // Update remaining + status
      const { error: updateErr } = await supabase
        .from('credits_debts')
        .update({ remaining: newRemaining, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', input.credit_debt_id)
        .eq('user_id', userId!)
      if (updateErr) throw updateErr
    },
    onSuccess: invalidate,
  })

  const settleRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('credits_debts')
        .update({ remaining: 0, status: 'settled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('credits_debts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const all      = query.data ?? []
  const iOwe     = all.filter((r) => r.type === 'i_owe')
  const theyOwe  = all.filter((r) => r.type === 'they_owe')
  const pending  = all.filter((r) => r.status !== 'settled')
  const settled  = all.filter((r) => r.status === 'settled')

  const totalOwed   = iOwe.filter((r)    => r.status !== 'settled').reduce((s, r) => s + Number(r.remaining), 0)
  const totalOwedTo = theyOwe.filter((r) => r.status !== 'settled').reduce((s, r) => s + Number(r.remaining), 0)

  return {
    all,
    iOwe,
    theyOwe,
    pending,
    settled,
    totalOwed,
    totalOwedTo,
    isLoading: query.isLoading,
    createRecord,
    logPayment,
    settleRecord,
    deleteRecord,
  }
}

/** Fetches payment history for a single credit/debt record. */
export async function getPaymentHistory(creditDebtId: string): Promise<CreditDebtPayment[]> {
  const { data, error } = await supabase
    .from('credit_debt_payments')
    .select('*')
    .eq('credit_debt_id', creditDebtId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}
