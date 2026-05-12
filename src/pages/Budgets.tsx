import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Copy, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

import PageHeader from '@/components/layout/PageHeader'
import { Switch } from '@/components/ui/switch'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from '@/components/ui/sheet'
import { useBudgets, fetchExpenseCategories } from '@/hooks/useBudgets'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, computeBudgetRemaining, getMonthLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

/** Budgets page — monthly budget vs actual spend with Nothing OS segment progress bar. */
export default function Budgets() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [sheetOpen, setSheetOpen] = useState(false)

  const { budgets, totalBudgeted, totalSpent, totalRemaining, isLoading, copyFromLastMonth } = useBudgets(month)

  async function handleCopyLastMonth() {
    try {
      await copyFromLastMonth.mutateAsync()
      toast.success('Budgets copied from last month')
    } catch {
      toast.error('Failed to copy budgets')
    }
  }

  const isCurrentMonth = format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  return (
    <div>
      <PageHeader
        title="Budgets"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLastMonth}
              disabled={copyFromLastMonth.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-grotesk text-xs border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 hover:text-mech-dark transition-colors duration-instant disabled:opacity-50"
            >
              <Copy size={12} strokeWidth={1.5} />
              Copy Last Month
            </button>
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-grotesk text-xs bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
            >
              <Settings2 size={12} strokeWidth={1.5} />
              Set Budgets
            </button>
          </div>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-1 text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="font-mono text-sm text-mech-dark min-w-[110px] text-center">
          {getMonthLabel(month)}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={isCurrentMonth}
          className="p-1 text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Summary row */}
      {!isLoading && budgets.length > 0 && (
        <div className="grid grid-cols-3 border border-mech-ink-20 mb-6">
          <SummaryCell label="BUDGETED" value={totalBudgeted} />
          <SummaryCell label="SPENT" value={totalSpent} highlight />
          <SummaryCell
            label="REMAINING"
            value={totalRemaining}
            signal={totalRemaining < 0}
          />
        </div>
      )}

      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="border border-dashed border-mech-ink-20 py-12 text-center">
          <p className="font-poppins text-body-md text-mech-ink-50 mb-3">
            No budgets set for {getMonthLabel(month)}.
          </p>
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
          >
            <Settings2 size={14} strokeWidth={1.5} />
            Set Budgets
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {budgets.map((b) => (
            <BudgetRow key={b.id} budget={b} />
          ))}
        </div>
      )}

      <SetBudgetsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        month={month}
      />
    </div>
  )
}

function SummaryCell({
  label, value, highlight, signal,
}: {
  label: string
  value: number
  highlight?: boolean
  signal?: boolean
}) {
  return (
    <div className={cn('px-4 py-3 border-r last:border-r-0 border-mech-ink-20', highlight && 'bg-mech-paper-secondary')}>
      <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-1">{label}</div>
      <div className={cn('font-mono text-sm font-medium', signal ? 'text-mech-signal-red' : 'text-mech-dark')}>
        {formatCurrency(value)}
      </div>
    </div>
  )
}

interface BudgetRowData {
  id: string
  amount: number
  spent?: number
  category?: { name: string; color?: string | null }
}

function BudgetRow({ budget }: { budget: BudgetRowData }) {
  const spent     = budget.spent ?? 0
  const amount    = Number(budget.amount)
  const remaining = computeBudgetRemaining(amount, spent)
  const pct       = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
  const isOver    = spent > amount
  const segments  = 40
  const filled    = Math.round((pct / 100) * segments)

  return (
    <div className="border border-mech-ink-20 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 flex-shrink-0"
            style={{ backgroundColor: budget.category?.color ?? '#D4C8C2', borderRadius: '50%' }}
          />
          <span className="font-grotesk text-sm text-mech-dark">{budget.category?.name ?? 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-mech-ink-50">
            {formatCurrency(spent)} / {formatCurrency(amount)}
          </span>
          <span className={cn('font-mono text-xs', isOver ? 'text-mech-signal-red' : 'text-mech-dark')}>
            {isOver ? `−${formatCurrency(Math.abs(remaining))} over` : formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Nothing OS segment bar */}
      <div className="flex gap-px h-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 0,
              background: i < filled
                ? (isOver ? '#E74C3C' : '#FF5B24')
                : '#D4C8C2',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Right-side sheet for setting budgets per expense category. */
function SetBudgetsSheet({
  open, onOpenChange, month,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  month: Date
}) {
  const userId = useAppStore((s) => s.user?.id)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(false)

  const { budgets, upsertBudget, deleteBudget } = useBudgets(month)
  const monthKey = format(startOfMonth(month), 'yyyy-MM-dd')

  useEffect(() => {
    if (!open || !userId) return
    setLoadingCats(true)
    fetchExpenseCategories(userId)
      .then(setCategories)
      .finally(() => setLoadingCats(false))
  }, [open, userId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-mech-paper border-l border-mech-ink-20 shadow-none flex flex-col overflow-y-auto"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-mech-ink-20">
          <SheetTitle className="font-grotesk font-semibold text-base text-mech-dark">
            Set Budgets — {getMonthLabel(month)}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingCats ? (
            <div className="font-poppins text-body-sm text-mech-ink-50 py-4">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="font-poppins text-body-sm text-mech-ink-50 py-4">No expense categories found.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {categories.map((cat) => {
                const existing = budgets.find((b) => b.category_id === cat.id)
                return (
                  <BudgetFormRow
                    key={cat.id}
                    category={cat}
                    existing={existing}
                    monthKey={monthKey}
                    onUpsert={(v) => upsertBudget.mutateAsync(v)}
                    onDelete={(id) => deleteBudget.mutateAsync(id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-mech-ink-20">
          <SheetClose
            render={
              <button className="w-full py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast" />
            }
          >
            Done
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface BudgetFormRowProps {
  category: Category
  existing?: { id: string; amount: number; rollover: boolean }
  monthKey: string
  onUpsert: (v: { category_id: string; month: string; amount: number; rollover: boolean }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function BudgetFormRow({ category, existing, monthKey, onUpsert, onDelete }: BudgetFormRowProps) {
  const [amount, setAmount]     = useState(existing ? String(existing.amount) : '')
  const [rollover, setRollover] = useState(existing?.rollover ?? false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    setAmount(existing ? String(existing.amount) : '')
    setRollover(existing?.rollover ?? false)
  }, [existing?.id])

  async function handleBlur() {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    setSaving(true)
    try {
      await onUpsert({ category_id: category.id, month: monthKey, amount: num, rollover })
    } catch {
      toast.error('Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!existing) return
    setSaving(true)
    try {
      await onDelete(existing.id)
      setAmount('')
      toast.success(`Budget removed for ${category.name}`)
    } catch {
      toast.error('Failed to remove budget')
    } finally {
      setSaving(false)
    }
  }

  async function handleRolloverChange(v: boolean) {
    setRollover(v)
    const num = parseFloat(amount)
    if (existing && !isNaN(num) && num > 0) {
      try {
        await onUpsert({ category_id: category.id, month: monthKey, amount: num, rollover: v })
      } catch {
        toast.error('Failed to update rollover')
      }
    }
  }

  return (
    <div className="border border-mech-ink-20 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 flex-shrink-0"
          style={{ backgroundColor: category.color ?? '#D4C8C2', borderRadius: '50%' }}
        />
        <span className="font-grotesk text-sm text-mech-dark flex-1">{category.name}</span>
        {existing && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-signal-red transition-colors duration-instant disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant flex-1">
          <span className="px-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none">LKR</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={handleBlur}
            placeholder="0.00"
            className="flex-1 px-2 py-1.5 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-grotesk text-xs text-mech-ink-50">Rollover</span>
          <Switch
            checked={rollover}
            onCheckedChange={handleRolloverChange}
          />
        </div>
      </div>
    </div>
  )
}
