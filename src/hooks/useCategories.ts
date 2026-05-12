import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Category } from '@/types'

type CreateCategoryInput = Pick<Category, 'name' | 'type'> & {
  icon?:  string | null
  color?: string | null
}
type UpdateCategoryInput = Partial<CreateCategoryInput> & { id: string }

/**
 * Hook for category operations.
 * Returns expense categories, income categories, and all categories.
 * Mutations invalidate ['categories', userId].
 */
export function useCategories() {
  const userId = useAppStore((s) => s.user?.id)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['categories', userId],
    enabled:  !!userId,
    queryFn:  async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId!)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories', userId] })

  const createCategory = useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: userId, is_default: false })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCategoryInput) => {
      const { error } = await supabase
        .from('categories')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const categories        = query.data ?? []
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both')
  const incomeCategories  = categories.filter((c) => c.type === 'income'  || c.type === 'both')

  return {
    categories,
    expenseCategories,
    incomeCategories,
    isLoading: query.isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}

/** Fetches transaction count for a given category — used to block deletion. */
export async function getCategoryTransactionCount(categoryId: string): Promise<number> {
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)
  return count ?? 0
}
