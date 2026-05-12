import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import FieldTooltip from '@/components/shared/FieldTooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTransfers } from '@/hooks/useTransfers'
import { useAccounts } from '@/hooks/useAccounts'
import { useGoals } from '@/hooks/useGoals'

const schema = z.object({
  from_account_id: z.string().min(1, 'Required'),
  to_goal_id:      z.string().min(1, 'Required'),
  amount:          z.coerce.number().positive('Must be positive'),
  date:            z.string().min(1, 'Required'),
  notes:           z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:           boolean
  onOpenChange:   (v: boolean) => void
  defaultGoalId?: string
}

/** Fund Goal dialog — transfers funds from an account into a savings goal. */
export function FundGoalDialog({ open, onOpenChange, defaultGoalId }: Props) {
  const { fundGoal } = useTransfers()
  const { activeAccounts } = useAccounts()
  const { goals } = useGoals()

  const activeGoals = goals.filter((g) => !g.is_completed)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      from_account_id: '',
      to_goal_id:      defaultGoalId ?? '',
      date:            new Date().toISOString().slice(0, 10),
    },
  })

  async function handleSubmit(values: FormValues) {
    try {
      await fundGoal.mutateAsync({
        from_account_id: values.from_account_id,
        to_goal_id:      values.to_goal_id,
        amount:          values.amount,
        date:            values.date,
        notes:           values.notes || null,
      })
      toast.success('Goal funded')
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Failed to fund goal')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[440px] sm:max-w-[440px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">Fund Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="From Account" required tooltip="Account to fund from." />
            <select
              {...form.register('from_account_id')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
            >
              <option value="">Select account</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {form.formState.errors.from_account_id && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.from_account_id.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Goal" required tooltip="Savings goal to fund." />
            <select
              {...form.register('to_goal_id')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
            >
              <option value="">Select goal</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {form.formState.errors.to_goal_id && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.to_goal_id.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Amount" required tooltip="Amount to contribute." />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none">LKR</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...form.register('amount')}
                  className="flex-1 px-2 py-2 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
              {form.formState.errors.amount && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.amount.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Date" required tooltip="Date of contribution." />
              <input
                type="date"
                {...form.register('date')}
                className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Notes" tooltip="Optional note." />
            <input
              {...form.register('notes')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50"
              placeholder="Optional note..."
            />
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
              {form.formState.isSubmitting ? 'Saving...' : 'Fund Goal'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
