import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

import PageHeader from '@/components/layout/PageHeader'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useCategories, getCategoryTransactionCount } from '@/hooks/useCategories'
import type { Category } from '@/types'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS = [
  'utensils', 'car', 'shopping-bag', 'zap', 'heart-pulse', 'clapperboard',
  'graduation-cap', 'home', 'sparkles', 'circle-ellipsis', 'briefcase',
  'laptop', 'building-2', 'trending-up', 'gift', 'plus-circle',
]

const CATEGORY_COLORS = [
  '#E74C3C', '#E67E22', '#9B59B6', '#3498DB', '#2ECC71', '#F39C12',
  '#1ABC9C', '#34495E',
]

const categorySchema = z.object({
  name:  z.string().min(1, 'Required').max(50, 'Max 50 characters'),
  type:  z.enum(['expense', 'income']),
  icon:  z.string().optional(),
  color: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

/** Settings page — categories management (expense + income). */
export default function Settings() {
  const { expenseCategories, incomeCategories, isLoading,
          createCategory, updateCategory, deleteCategory } = useCategories()

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCategory.mutateAsync(deleteTarget.id)
      toast.success('Category deleted')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />

      {/* Categories section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50">Categories</span>
          <div className="flex-1 border-t border-dashed border-mech-ink-20" />
        </div>

        {isLoading ? (
          <div className="font-poppins text-body-md text-mech-ink-50 py-4">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CategoryColumn
              title="Expense Categories"
              type="expense"
              categories={expenseCategories}
              onCreate={async (v) => { await createCategory.mutateAsync({ ...v, type: 'expense' }); toast.success('Category created') }}
              onUpdate={async (id, v) => { await updateCategory.mutateAsync({ id, ...v }); toast.success('Category updated') }}
              onDelete={setDeleteTarget}
            />
            <CategoryColumn
              title="Income Categories"
              type="income"
              categories={incomeCategories}
              onCreate={async (v) => { await createCategory.mutateAsync({ ...v, type: 'income' }); toast.success('Category created') }}
              onUpdate={async (id, v) => { await updateCategory.mutateAsync({ id, ...v }); toast.success('Category updated') }}
              onDelete={setDeleteTarget}
            />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}

interface CategoryColumnProps {
  title:      string
  type:       'expense' | 'income'
  categories: Category[]
  onCreate:   (values: Omit<CategoryFormValues, 'type'>) => Promise<void>
  onUpdate:   (id: string, values: Omit<CategoryFormValues, 'type'>) => Promise<void>
  onDelete:   (category: Category) => void
}

function CategoryColumn({ title, type, categories, onCreate, onUpdate, onDelete }: CategoryColumnProps) {
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-grotesk font-medium text-sm text-mech-dark">{title}</span>
        <button
          onClick={() => { setShowForm(true); setEditTarget(null) }}
          className="inline-flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
        >
          <Plus size={12} strokeWidth={1.5} /> Add Category
        </button>
      </div>

      {(showForm || editTarget) && (
        <CategoryInlineForm
          type={type}
          initial={editTarget ? { name: editTarget.name, icon: editTarget.icon ?? '', color: editTarget.color ?? '' } : undefined}
          onSave={async (values) => {
            if (editTarget) {
              await onUpdate(editTarget.id, values)
              setEditTarget(null)
            } else {
              await onCreate(values)
              setShowForm(false)
            }
          }}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      <div className="border border-mech-ink-20 divide-y divide-mech-ink-20">
        {categories.length === 0 && (
          <div className="px-4 py-3 font-poppins text-body-sm text-mech-ink-50">No categories yet.</div>
        )}
        {(() => {
          const nameCounts = categories.reduce<Record<string, number>>((acc, c) => {
            acc[c.name] = (acc[c.name] ?? 0) + 1
            return acc
          }, {})
          return categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              isDuplicate={(nameCounts[cat.name] ?? 1) > 1}
              onEdit={() => { setEditTarget(cat); setShowForm(false) }}
              onDelete={() => onDelete(cat)}
            />
          ))
        })()}
      </div>
    </div>
  )
}

interface CategoryInlineFormProps {
  type:     'expense' | 'income'
  initial?: { name: string; icon: string; color: string }
  onSave:   (values: Omit<CategoryFormValues, 'type'>) => Promise<void>
  onCancel: () => void
}

function CategoryInlineForm({ type, initial, onSave, onCancel }: CategoryInlineFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name:  initial?.name  ?? '',
      type,
      icon:  initial?.icon  ?? CATEGORY_ICONS[0],
      color: initial?.color ?? CATEGORY_COLORS[0],
    },
  })

  async function handleSubmit(values: CategoryFormValues) {
    const { type: _t, ...rest } = values
    await onSave(rest)
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="mb-3 p-4 bg-mech-paper border border-mech-ink-20 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <FieldTooltip label="Name" required tooltip="Category name shown on transactions and charts. Keep it short." />
        <input
          {...form.register('name')}
          className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
          placeholder="Category name"
          autoFocus
        />
        {form.formState.errors.name && (
          <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldTooltip label="Color" tooltip="Used in pie/donut charts to identify this category segment." />
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => form.setValue('color', c)}
              className={cn(
                'w-6 h-6 border-2 transition-colors duration-instant',
                form.watch('color') === c ? 'border-mech-dark' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldTooltip label="Icon" tooltip="Icon shown next to this category in lists and charts." />
        <div className="flex flex-wrap gap-1">
          {CATEGORY_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => form.setValue('icon', ic)}
              className={cn(
                'px-2 py-1 font-grotesk text-xs border transition-colors duration-instant',
                form.watch('icon') === ic
                  ? 'border-mech-dark bg-mech-dark text-mech-paper'
                  : 'border-mech-ink-20 text-mech-ink-80 hover:border-mech-dark'
              )}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 font-grotesk text-xs border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 transition-colors duration-instant"
        >
          <X size={12} strokeWidth={1.5} /> Cancel
        </button>
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="flex items-center gap-1 px-3 py-1.5 font-grotesk text-xs bg-mech-dark text-mech-paper border border-mech-dark disabled:opacity-50"
        >
          <Check size={12} strokeWidth={1.5} /> {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

interface CategoryRowProps {
  category:    Category
  isDuplicate: boolean
  onEdit:      () => void
  onDelete:    () => void
}

function CategoryRow({ category, isDuplicate, onEdit, onDelete }: CategoryRowProps) {
  const [txCount, setTxCount] = useState<number | null>(null)

  useEffect(() => {
    getCategoryTransactionCount(category.id).then(setTxCount)
  }, [category.id])

  const canDelete = (isDuplicate || !category.is_default) && (txCount === 0 || txCount === null)

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-mech-paper-secondary transition-colors duration-instant">
      <div className="flex items-center gap-2.5">
        <div
          className="w-2 h-2 flex-shrink-0"
          style={{ backgroundColor: category.color ?? '#D4C8C2', borderRadius: '50%' }}
        />
        <span className="font-grotesk text-sm text-mech-dark">{category.name}</span>
        {category.is_default && (
          <span className="font-mono text-xs uppercase text-mech-ink-50">(default)</span>
        )}
        {txCount !== null && txCount > 0 && (
          <span className="font-mono text-xs text-mech-ink-50">{txCount} txn{txCount !== 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
        >
          <Edit2 size={12} strokeWidth={1.5} /> Edit
        </button>
        <button
          onClick={canDelete ? onDelete : undefined}
          disabled={!canDelete}
          title={
            txCount && txCount > 0
              ? `${txCount} transaction(s) use this category`
              : category.is_default && !isDuplicate
                ? 'Default categories cannot be deleted'
                : undefined
          }
          className={cn(
            'flex items-center gap-1 font-grotesk text-xs transition-colors duration-instant',
            canDelete
              ? 'text-mech-ink-50 hover:text-mech-signal-red cursor-pointer'
              : 'text-mech-ink-20 cursor-not-allowed'
          )}
        >
          <Trash2 size={12} strokeWidth={1.5} /> Delete
        </button>
      </div>
    </div>
  )
}
