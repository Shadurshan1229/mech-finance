import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Target, Check } from 'lucide-react'
import { toast } from 'sonner'

import PageHeader from '@/components/layout/PageHeader'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { FundGoalDialog } from '@/components/forms/FundGoalDialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useGoals } from '@/hooks/useGoals'
import { formatCurrency, computeGoalProgress } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { GoalWithProgress } from '@/hooks/useGoals'

const GOAL_COLORS = [
  '#FF5B24', '#E74C3C', '#E67E22', '#9B59B6',
  '#3498DB', '#2ECC71', '#1ABC9C', '#34495E',
]

const goalSchema = z.object({
  name:           z.string().min(1, 'Required').max(100),
  target_amount:  z.coerce.number().positive('Must be positive'),
  initial_amount: z.coerce.number().min(0).optional(),
  target_date:    z.string().optional(),
  color:          z.string().optional(),
})

type GoalFormValues = z.infer<typeof goalSchema>

/** Goals page — savings targets with Nothing OS progress bars and fund/complete actions. */
export default function Goals() {
  const [addOpen, setAddOpen]           = useState(false)
  const [fundTarget, setFundTarget]     = useState<GoalWithProgress | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GoalWithProgress | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const { active, completed, isLoading, createGoal, completeGoal, deleteGoal } = useGoals()

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteGoal.mutateAsync(deleteTarget.id)
      toast.success('Goal deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete goal')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalTargeted = active.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalSaved    = active.reduce((s, g) => s + g.current, 0)

  return (
    <div>
      <PageHeader
        title="Goals"
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-grotesk text-xs bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
          >
            <Plus size={12} strokeWidth={1.5} />
            New Goal
          </button>
        }
      />

      {/* Summary strip */}
      {!isLoading && active.length > 0 && (
        <div className="grid grid-cols-2 border border-mech-ink-20 mb-6">
          <div className="px-4 py-3 border-r border-mech-ink-20">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-1">TOTAL TARGET</div>
            <div className="font-mono text-sm font-medium text-mech-dark">{formatCurrency(totalTargeted)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-1">TOTAL SAVED</div>
            <div className="font-mono text-sm font-medium text-mech-signal-green">{formatCurrency(totalSaved)}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading goals...</div>
      ) : active.length === 0 && !showCompleted ? (
        <div className="border border-dashed border-mech-ink-20 py-12 text-center">
          <Target size={32} strokeWidth={1} className="mx-auto mb-3 text-mech-ink-20" />
          <p className="font-poppins text-body-md text-mech-ink-50 mb-3">No active goals yet.</p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
          >
            <Plus size={14} strokeWidth={1.5} />
            New Goal
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onFund={() => setFundTarget(goal)}
              onComplete={() => {
                completeGoal.mutateAsync(goal.id).then(() => toast.success(`"${goal.name}" marked complete`))
              }}
              onDelete={() => setDeleteTarget(goal)}
            />
          ))}

          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant mb-3"
              >
                {showCompleted ? 'Hide' : 'Show'} completed ({completed.length})
              </button>
              {showCompleted && completed.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onFund={() => {}}
                  onComplete={() => {}}
                  onDelete={() => setDeleteTarget(goal)}
                  dimmed
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AddGoalDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={async (values) => {
          await createGoal.mutateAsync({
            ...values,
            target_date:   values.target_date   || null,
            initial_amount: values.initial_amount ?? 0,
            color:         values.color         || null,
          })
          toast.success('Goal created')
          setAddOpen(false)
        }}
      />

      {fundTarget && (
        <FundGoalDialog
          open={!!fundTarget}
          onOpenChange={(v) => !v && setFundTarget(null)}
          defaultGoalId={fundTarget.id}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete goal?"
        description={`"${deleteTarget?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}

function GoalCard({
  goal, onFund, onComplete, onDelete, dimmed,
}: {
  goal:       GoalWithProgress
  onFund:     () => void
  onComplete: () => void
  onDelete:   () => void
  dimmed?:    boolean
}) {
  const segments = 40
  const filled   = Math.round((goal.progress / 100) * segments)
  const color    = goal.color ?? '#FF5B24'
  const isComplete = goal.is_completed

  return (
    <div className={cn('border border-mech-ink-20 p-4', dimmed && 'opacity-60')}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="font-grotesk font-medium text-sm text-mech-dark truncate">{goal.name}</span>
          {isComplete && (
            <span className="inline-flex items-center gap-0.5 font-mono text-xs uppercase tracking-[0.08em] text-mech-signal-green">
              <Check size={10} strokeWidth={2} /> Done
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isComplete && (
            <>
              <button
                onClick={onFund}
                className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
              >
                Fund
              </button>
              {goal.progress >= 100 && (
                <button
                  onClick={onComplete}
                  className="inline-flex items-center gap-0.5 font-grotesk text-xs text-mech-signal-green hover:opacity-80 transition-opacity"
                >
                  <Check size={11} strokeWidth={1.5} /> Complete
                </button>
              )}
            </>
          )}
          <button
            onClick={onDelete}
            className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-signal-red transition-colors duration-instant"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-mech-ink-50">
          {formatCurrency(goal.current)} / {formatCurrency(Number(goal.target_amount))}
        </span>
        <span className={cn(
          'font-mono text-xs',
          goal.progress >= 100 ? 'text-mech-signal-green' : 'text-mech-dark'
        )}>
          {Math.round(goal.progress)}%
        </span>
      </div>

      {/* Nothing OS segment bar */}
      <div className="flex gap-px h-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 0,
              background: i < filled ? color : '#D4C8C2',
            }}
          />
        ))}
      </div>

      {goal.target_date && (
        <div className="mt-2 font-mono text-xs text-mech-ink-50">
          Target: {goal.target_date}
        </div>
      )}
    </div>
  )
}

function AddGoalDialog({
  open, onOpenChange, onSubmit,
}: {
  open:         boolean
  onOpenChange: (v: boolean) => void
  onSubmit:     (values: GoalFormValues) => Promise<void>
}) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { color: GOAL_COLORS[0] },
  })

  async function handleSubmit(values: GoalFormValues) {
    await onSubmit(values)
    form.reset({ color: GOAL_COLORS[0] })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[480px] sm:max-w-[480px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">New Savings Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Goal Name" required tooltip="e.g. Emergency Fund, New Laptop, Holiday Trip" />
            <input
              {...form.register('name')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50"
              placeholder="Goal name"
              autoFocus
            />
            {form.formState.errors.name && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.name.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Target Amount" required tooltip="How much you want to save." />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none">LKR</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...form.register('target_amount')}
                  className="flex-1 px-2 py-2 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
              {form.formState.errors.target_amount && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.target_amount.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Initial Amount" tooltip="Amount already saved toward this goal." />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none">LKR</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register('initial_amount')}
                  className="flex-1 px-2 py-2 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Target Date" tooltip="Optional deadline." />
            <input
              type="date"
              {...form.register('target_date')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Color" tooltip="Used for the goal progress bar." />
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
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

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2 font-grotesk text-sm border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 transition-colors duration-instant"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-1 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark disabled:opacity-50"
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
