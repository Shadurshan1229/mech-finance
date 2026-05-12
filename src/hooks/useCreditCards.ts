import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { computeCCOutstanding } from '@/lib/utils'
import type { CreditCard } from '@/types'

export interface CreditCardWithStats extends CreditCard {
  outstanding:  number
  available:    number
  utilization:  number
}

type CreateCardInput = {
  name:         string
  bank?:         string | null
  last_four?:    string | null
  credit_limit:  number
  billing_date?: number | null
  due_date?:     number | null
  color?:        string | null
}
type UpdateCardInput = Partial<CreateCardInput> & { id: string }

/**
 * Hook for credit card operations.
 * Computes outstanding balance, available credit, and utilization per card.
 * All mutations invalidate ['credit-cards', userId].
 */
export function useCreditCards() {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['credit-cards', userId],
    enabled:  !!userId,
    queryFn:  async (): Promise<CreditCardWithStats[]> => {
      const { data: cards, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })

      if (error) throw error

      const withStats = await Promise.all(
        cards.map(async (card: CreditCard) => {
          const [expenseRes, paymentRes] = await Promise.all([
            supabase
              .from('transactions')
              .select('amount')
              .eq('credit_card_id', card.id)
              .eq('type', 'expense'),
            supabase
              .from('transfers')
              .select('amount')
              .eq('to_card_id', card.id),
          ])

          const sum = (rows: { amount: number }[] | null) =>
            (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)

          const outstanding = computeCCOutstanding({
            totalExpenses: sum(expenseRes.data),
            totalPayments: sum(paymentRes.data),
          })
          const limit       = Number(card.credit_limit)
          const available   = limit - outstanding
          const utilization = limit > 0 ? (outstanding / limit) * 100 : 0

          return { ...card, outstanding, available, utilization }
        })
      )

      return withStats
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['credit-cards', userId] })

  const createCard = useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const { error } = await supabase
        .from('credit_cards')
        .insert({ ...input, user_id: userId, currency: 'LKR', is_active: true })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateCard = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCardInput) => {
      const { error } = await supabase
        .from('credit_cards')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const archiveCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('credit_cards')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const activeCards   = query.data?.filter((c) => c.is_active)  ?? []
  const archivedCards = query.data?.filter((c) => !c.is_active) ?? []

  return {
    cards: query.data ?? [],
    activeCards,
    archivedCards,
    isLoading: query.isLoading,
    createCard,
    updateCard,
    archiveCard,
  }
}
