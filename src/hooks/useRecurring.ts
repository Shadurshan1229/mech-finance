import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addMonths, addYears, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { RecurringPayment } from '@/types'

type CreateRecurringInput = {
  name:            string
  amount:          number
  billing_cycle:   'monthly' | 'quarterly' | 'yearly'
  next_date:       string
  category_id?:    string | null
  account_id?:     string | null
  credit_card_id?: string | null
  auto_log?:       boolean
}

type UpdateRecurringInput = Partial<CreateRecurringInput> & { id: string }

type ConfirmPaymentInput = {
  recurring:        RecurringPayment
  amount:           number
  date:             string
  account_id?:      string | null
  credit_card_id?:  string | null
  notes?:           string | null
  updateRecurring?: boolean
}

type SkipPaymentInput = {
  recurring: RecurringPayment
  reason?:   string | null
}

function advanceDate(dateStr: string, cycle: 'monthly' | 'quarterly' | 'yearly'): string {
  const d = parseISO(dateStr)
  if (cycle === 'quarterly') return format(addMonths(d, 3), 'yyyy-MM-dd')
  if (cycle === 'yearly')    return format(addYears(d, 1),  'yyyy-MM-dd')
  return format(addMonths(d, 1), 'yyyy-MM-dd')
}

/**
 * Hook for recurring payment full lifecycle.
 * Computes dueToday, overdue, upcoming based on next_date vs today.
 * confirmPayment creates a real transaction and advances next_date.
 * skipPayment logs a skip and advances next_date without a transaction.
 */
export function useRecurring() {
  const userId = useAppStore((s) => s.user?.id)
  const qc     = useQueryClient()
  const today  = format(new Date(), 'yyyy-MM-dd')
  const in7    = format(addMonths(new Date(), 0), 'yyyy-MM-dd') // computed below

  const query = useQuery({
    queryKey: ['recurring', userId],
    enabled:  !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    queryFn:  async (): Promise<RecurringPayment[]> => {
      const { data, error } = await supabase
        .from('recurring_payments')
        .select('*')
        .eq('user_id', userId!)
        .order('next_date', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['recurring', userId] })

  const createRecurring = useMutation({
    mutationFn: async (input: CreateRecurringInput) => {
      const { error } = await supabase
        .from('recurring_payments')
        .insert({ ...input, user_id: userId, status: 'active', auto_log: input.auto_log ?? false })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateRecurring = useMutation({
    mutationFn: async ({ id, ...input }: UpdateRecurringInput) => {
      const { error } = await supabase
        .from('recurring_payments')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const confirmPayment = useMutation({
    mutationFn: async (input: ConfirmPaymentInput) => {
      const { recurring } = input
      const { error: txErr } = await supabase.from('transactions').insert({
        type:           'expense',
        amount:         input.amount,
        date:           input.date,
        description:    recurring.name,
        category_id:    recurring.category_id ?? null,
        account_id:     input.account_id    ?? recurring.account_id    ?? null,
        credit_card_id: input.credit_card_id ?? recurring.credit_card_id ?? null,
        notes:          input.notes ?? null,
        is_recurring:   true,
        recurring_id:   recurring.id,
        user_id:        userId,
        ai_categorized: false,
        occasion:       null,
        receipt_url:    null,
      })
      if (txErr) throw txErr

      const nextDate   = advanceDate(recurring.next_date, recurring.billing_cycle)
      const updateData: Record<string, unknown> = { next_date: nextDate }
      if (input.updateRecurring) updateData.amount = input.amount

      const { error: upErr } = await supabase
        .from('recurring_payments')
        .update(updateData)
        .eq('id', recurring.id)
        .eq('user_id', userId!)
      if (upErr) throw upErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring',    userId] })
      qc.invalidateQueries({ queryKey: ['transactions', userId] })
      qc.invalidateQueries({ queryKey: ['accounts',     userId] })
    },
  })

  const skipPayment = useMutation({
    mutationFn: async (input: SkipPaymentInput) => {
      const { recurring } = input
      const { error: skipErr } = await supabase.from('recurring_skips').insert({
        recurring_id: recurring.id,
        skipped_date: recurring.next_date,
        reason:       input.reason ?? null,
      })
      if (skipErr) throw skipErr

      const nextDate = advanceDate(recurring.next_date, recurring.billing_cycle)
      const { error: upErr } = await supabase
        .from('recurring_payments')
        .update({ next_date: nextDate })
        .eq('id', recurring.id)
        .eq('user_id', userId!)
      if (upErr) throw upErr
    },
    onSuccess: invalidate,
  })

  const pauseRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_payments')
        .update({ status: 'paused' })
        .eq('id', id).eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const resumeRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_payments')
        .update({ status: 'active' })
        .eq('id', id).eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const archiveRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_payments')
        .update({ status: 'inactive' })
        .eq('id', id).eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const all      = query.data ?? []
  const recurring = all
  const active   = all.filter((r) => r.status === 'active')
  const paused   = all.filter((r) => r.status === 'paused')
  const archived = all.filter((r) => r.status === 'inactive')

  const sevenDaysLater = format(addMonths(new Date(), 0), 'yyyy-MM-dd')
  // compute upcoming as next 7 calendar days
  const upcomingEnd = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return format(d, 'yyyy-MM-dd')
  })()

  const dueToday = active.filter((r) => r.next_date === today)
  const overdue  = active.filter((r) => r.next_date < today)
  const upcoming = active.filter((r) => r.next_date > today && r.next_date <= upcomingEnd)
  const dueCount = dueToday.length + overdue.length

  const monthlyTotal = active.reduce((s, r) => {
    const cycle = r.billing_cycle
    const amt   = Number(r.amount)
    if (cycle === 'quarterly') return s + amt / 3
    if (cycle === 'yearly')    return s + amt / 12
    return s + amt
  }, 0)

  return {
    recurring,
    active,
    paused,
    archived,
    dueToday,
    overdue,
    upcoming,
    dueCount,
    monthlyTotal,
    isLoading: query.isLoading,
    createRecurring,
    updateRecurring,
    confirmPayment,
    skipPayment,
    pauseRecurring,
    resumeRecurring,
    archiveRecurring,
  }
}
