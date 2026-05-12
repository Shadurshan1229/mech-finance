import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import FieldTooltip from '@/components/shared/FieldTooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTransfers } from '@/hooks/useTransfers'
import { useAccounts } from '@/hooks/useAccounts'

const schema = z.object({
  from_account_id: z.string().min(1, 'Required'),
  to_account_id:   z.string().min(1, 'Required'),
  amount:          z.coerce.number().positive('Must be positive'),
  date:            z.string().min(1, 'Required'),
  notes:           z.string().optional(),
}).refine((d) => d.from_account_id !== d.to_account_id, {
  message: 'Source and destination must differ',
  path: ['to_account_id'],
})

type FormValues = z.infer<typeof schema>

interface Props {
  open:           boolean
  onOpenChange:   (v: boolean) => void
  defaultFromId?: string
}

/** Withdraw Cash dialog — moves funds from a bank/ewallet account to a cash account. */
export function WithdrawCashDialog({ open, onOpenChange, defaultFromId }: Props) {
  const { withdrawCash } = useTransfers()
  const { activeAccounts } = useAccounts()

  const cashAccounts   = activeAccounts.filter((a) => a.type === 'cash')
  const sourceAccounts = activeAccounts.filter((a) => a.type !== 'cash')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      from_account_id: defaultFromId ?? '',
      to_account_id:   '',
      date:            new Date().toISOString().slice(0, 10),
    },
  })

  async function handleSubmit(values: FormValues) {
    try {
      await withdrawCash.mutateAsync({
        from_account_id: values.from_account_id,
        to_account_id:   values.to_account_id,
        amount:          values.amount,
        date:            values.date,
        notes:           values.notes || null,
      })
      toast.success('Cash withdrawal recorded')
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Failed to record withdrawal')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[440px] sm:max-w-[440px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">Withdraw Cash</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="From Account" required tooltip="Bank or e-wallet account to withdraw from." />
            <select
              {...form.register('from_account_id')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
            >
              <option value="">Select account</option>
              {sourceAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {form.formState.errors.from_account_id && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.from_account_id.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="To Cash Account" required tooltip="Cash account to receive the withdrawal." />
            <select
              {...form.register('to_account_id')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
            >
              <option value="">Select cash account</option>
              {cashAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {form.formState.errors.to_account_id && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.to_account_id.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Amount" required tooltip="Amount to withdraw." />
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
              <FieldTooltip label="Date" required tooltip="Date of withdrawal." />
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
              {form.formState.isSubmitting ? 'Saving...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
