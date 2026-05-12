import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { computeGoalCurrent, computeGoalProgress } from '@/lib/utils'
import type { Goal } from '@/types'

export interface GoalWithProgress extends Goal {
  current:   number
  progress:  number
}

type CreateGoalInput = {
  name:           string
  target_amount:  number
  initial_amount?: number
  target_date?:   string | null
  icon?:          string | null
  color?:         string | null
}

type UpdateGoalInput = Partial<CreateGoalInput> & { id: string }

/**
 * Hook for goals with live progress computation.
 * Current amount = initial_amount + SUM of all transfers to this goal.
 */
export function useGoals() {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['goals', userId],
    enabled:  !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    queryFn:  async (): Promise<GoalWithProgress[]> => {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })
      if (error) throw error

      const withProgress = await Promise.all(
        goals.map(async (goal: Goal) => {
          const { data: transfers } = await supabase
            .from('transfers')
            .select('amount')
            .eq('to_goal_id', goal.id)

          const totalTransfers = (transfers ?? []).reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0)
          const current  = computeGoalCurrent({ initialAmount: Number(goal.initial_amount), totalTransfers })
          const progress = computeGoalProgress(current, Number(goal.target_amount))

          return { ...goal, current, progress }
        })
      )

      return withProgress
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals', userId] })

  const createGoal = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { error } = await supabase
        .from('goals')
        .insert({
          ...input,
          user_id:        userId,
          initial_amount: input.initial_amount ?? 0,
          is_completed:   false,
        })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...input }: UpdateGoalInput) => {
      const { error } = await supabase
        .from('goals')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const completeGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const goals     = query.data ?? []
  const active    = goals.filter((g) => !g.is_completed)
  const completed = goals.filter((g) =>  g.is_completed)

  return {
    goals,
    active,
    completed,
    isLoading: query.isLoading,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
  }
}
