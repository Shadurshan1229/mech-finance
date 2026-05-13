import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'
import { Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import PageHeader from '@/components/layout/PageHeader'
import AmountDisplay from '@/components/shared/AmountDisplay'
import StatusBadge from '@/components/shared/StatusBadge'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useRecurring } from '@/hooks/useRecurring'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { formatCurrency, normalizeToMonthly } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { RecurringPayment } from '@/types'

const recurringSchema = z.object({
  name:           z.string().min(1, 'Required').max(100),
  amount:         z.coerce.number().positive('Must be positive'),
  billing_cycle:  z.enum(['monthly', 'quarterly', 'yearly']),
  next_date:      z.string().min(1, 'Required'),
  category_id:    z.string().optional(),
  account_id:     z.string().optional(),
  credit_card_id: z.string().optional(),
  auto_log:       z.boolean().default(false),
})

const confirmSchema = z.object({
  amount:          z.coerce.number().positive('Required'),
  date:            z.string().min(1, 'Required'),
  account_id:      z.string().optional(),
  credit_card_id:  z.string().optional(),
  notes:           z.string().optional(),
  updateRecurring: z.boolean().default(false),
})

const skipSchema = z.object({
  reason: z.string().optional(),
})

type RecurringFormValues = z.infer<typeof recurringSchema>
type ConfirmFormValues   = z.infer<typeof confirmSchema>
type SkipFormValues      = z.infer<typeof skipSchema>
type FilterKey = 'all' | 'active' | 'paused' | 'inactive'

const CYCLE_LABELS: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
const STATUS_LABELS: Record<string, string> = { active: 'Active', paused: 'Paused', inactive: 'Archived' }
const STATUS_VARIANTS: Record<string, 'default' | 'signal' | 'success' | 'error'> = {
  active: 'success', paused: 'default', inactive: 'default',
}

function getDueBadge(r: RecurringPayment): { label: string; color: string } | null {
  const today = format(new Date(), 'yyyy-MM-dd')
  const in7   = format(addDays(new Date(), 7), 'yyyy-MM-dd')
  if (r.next_date < today)  return { label: 'OVERDUE', color: 'text-mech-signal-red' }
  if (r.next_date === today) return { label: 'DUE TODAY', color: 'text-mech-orange' }
  if (r.next_date <= in7) {
    const days = Math.ceil((new Date(r.next_date).getTime() - new Date().getTime()) / 86400000)
    return { label: `IN ${days}d`, color: 'text-mech-ink-80' }
  }
  return null
}

/** Recurring payments page — full lifecycle management of subscriptions and fixed charges. */
export default function Recurring() {
  const [filter, setFilter]               = useState<FilterKey>('all')
  const [addOpen, setAddOpen]             = useState(false)
  const [editTarget, setEditTarget]       = useState<RecurringPayment | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<RecurringPayment | null>(null)
  const [skipTarget, setSkipTarget]       = useState<RecurringPayment | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<RecurringPayment | null>(null)

  const {
    recurring, dueToday, overdue, monthlyTotal, isLoading,
    createRecurring, updateRecurring, confirmPayment, skipPayment,
    pauseRecurring, resumeRecurring, archiveRecurring,
  } = useRecurring()

  const today = format(new Date(), 'yyyy-MM-dd')

  const visible = filter === 'all'
    ? recurring
    : recurring.filter((r) => r.status === filter)

  const activeCount   = recurring.filter((r) => r.status === 'active').length
  const pausedCount   = recurring.filter((r) => r.status === 'paused').length
  const dueCount      = dueToday.length + overdue.length

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'paused',   label: 'Paused' },
    { key: 'inactive', label: 'Archived' },
  ]

  async function handleArchiveConfirm() {
    if (!archiveTarget) return
    try {
      await archiveRecurring.mutateAsync(archiveTarget.id)
      toast.success('Archived')
      setArchiveTarget(null)
    } catch {
      toast.error('Failed to archive')
    }
  }

  return (
    <div>
      <PageHeader
        title="Recurring Payments"
        description="Manage your subscriptions and fixed recurring payments."
        actions={
          <button
            onClick={() => { setEditTarget(null); setAddOpen(true) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-grotesk text-xs bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
          >
            <Plus size={12} strokeWidth={1.5} />
            Add Recurring
          </button>
        }
      />

      {/* Due alerts banner */}
      {!isLoading && dueCount > 0 && (
        <div className="mb-4 px-4 py-3 border border-mech-orange flex items-center gap-3" style={{ background: 'rgba(255,91,36,0.06)' }}>
          <AlertCircle size={16} strokeWidth={1.5} className="text-mech-orange flex-shrink-0" />
          <span className="font-poppins text-sm text-mech-dark">
            {dueCount} payment{dueCount !== 1 ? 's' : ''} due
            {overdue.length > 0 && (
              <span className="text-mech-signal-red ml-1">({overdue.length} overdue)</span>
            )}
            {' '}— review and confirm below
          </span>
        </div>
      )}

      {/* Summary strip */}
      {!isLoading && recurring.length > 0 && (
        <div className="grid grid-cols-4 border border-mech-ink-20 mb-6">
          {[
            { label: 'Monthly Total', value: formatCurrency(monthlyTotal), mono: true },
            { label: 'Active',        value: String(activeCount),          mono: false },
            { label: 'Paused',        value: String(pausedCount),          mono: false },
            { label: 'Due / Overdue', value: String(dueCount),             mono: false, red: dueCount > 0 },
          ].map((cell) => (
            <div key={cell.label} className="px-4 py-3 border-r last:border-r-0 border-mech-ink-20">
              <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-1">{cell.label}</div>
              <div className={cn('font-mono text-sm font-medium', cell.red ? 'text-mech-signal-red' : 'text-mech-dark')}>
                {cell.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border-b border-mech-ink-20 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 font-grotesk text-sm border-b-2 transition-colors duration-instant',
              filter === tab.key
                ? 'border-mech-orange text-mech-dark'
                : 'border-transparent text-mech-ink-50 hover:text-mech-dark'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed border-mech-ink-20 py-12 text-center">
          <p className="font-poppins text-body-md text-mech-ink-50 mb-3">No recurring payments{filter !== 'all' ? ` in ${filter}` : ''}.</p>
          {filter === 'all' && (
            <button
              onClick={() => { setEditTarget(null); setAddOpen(true) }}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
            >
              <Plus size={14} strokeWidth={1.5} />
              Add Recurring
            </button>
          )}
        </div>
      ) : (
        /* Table */
        <div className="border border-mech-ink-20 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-mech-ink-20 bg-mech-paper-secondary">
                {['Name', 'Amount', 'Cycle', 'Next Date', 'Account', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mech-ink-20">
              {visible.map((r) => (
                <RecurringRow
                  key={r.id}
                  item={r}
                  today={today}
                  onConfirm={() => setConfirmTarget(r)}
                  onSkip={() => setSkipTarget(r)}
                  onEdit={() => { setEditTarget(r); setAddOpen(true) }}
                  onPause={() => pauseRecurring.mutateAsync(r.id).then(() => toast.success('Paused')).catch(() => toast.error('Failed'))}
                  onResume={() => resumeRecurring.mutateAsync(r.id).then(() => toast.success('Resumed')).catch(() => toast.error('Failed'))}
                  onArchive={() => setArchiveTarget(r)}
                  onRestore={() => resumeRecurring.mutateAsync(r.id).then(() => toast.success('Restored')).catch(() => toast.error('Failed'))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit dialog */}
      <RecurringFormDialog
        open={addOpen}
        onOpenChange={(v) => { setAddOpen(v); if (!v) setEditTarget(null) }}
        editTarget={editTarget}
        onSubmit={async (values) => {
          if (editTarget) {
            await updateRecurring.mutateAsync({ id: editTarget.id, ...values })
            toast.success('Updated')
          } else {
            await createRecurring.mutateAsync(values)
            toast.success('Added')
          }
          setAddOpen(false)
          setEditTarget(null)
        }}
      />

      {/* Confirm payment dialog */}
      {confirmTarget && (
        <ConfirmPaymentDialog
          open={!!confirmTarget}
          onOpenChange={(v) => !v && setConfirmTarget(null)}
          recurring={confirmTarget}
          onConfirm={async (values) => {
            await confirmPayment.mutateAsync({ recurring: confirmTarget, ...values })
            toast.success('Payment logged')
            setConfirmTarget(null)
          }}
        />
      )}

      {/* Skip payment dialog */}
      {skipTarget && (
        <SkipPaymentDialog
          open={!!skipTarget}
          onOpenChange={(v) => !v && setSkipTarget(null)}
          recurring={skipTarget}
          onSkip={async (values) => {
            await skipPayment.mutateAsync({ recurring: skipTarget, reason: values.reason || null })
            toast.success('Skipped — next date advanced')
            setSkipTarget(null)
          }}
        />
      )}

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(v) => !v && setArchiveTarget(null)}
        title="Archive recurring payment?"
        description={`"${archiveTarget?.name}" will be archived. You can restore it later.`}
        confirmLabel="Archive"
        onConfirm={handleArchiveConfirm}
        loading={archiveRecurring.isPending}
      />
    </div>
  )
}

function RecurringRow({
  item, today, onConfirm, onSkip, onEdit, onPause, onResume, onArchive, onRestore,
}: {
  item:      RecurringPayment
  today:     string
  onConfirm: () => void
  onSkip:    () => void
  onEdit:    () => void
  onPause:   () => void
  onResume:  () => void
  onArchive: () => void
  onRestore: () => void
}) {
  const isOverdue  = item.status === 'active' && item.next_date < today
  const isDueToday = item.status === 'active' && item.next_date === today
  const dueBadge   = getDueBadge(item)

  const dateColor = isOverdue ? 'text-mech-signal-red' : isDueToday ? 'text-mech-orange' : 'text-mech-ink-80'

  return (
    <tr className="hover:bg-mech-paper-secondary transition-colors duration-instant">
      <td className="px-4 py-3">
        <span className="font-grotesk text-sm text-mech-dark">{item.name}</span>
      </td>
      <td className="px-4 py-3">
        <AmountDisplay amount={Number(item.amount)} size="sm" />
      </td>
      <td className="px-4 py-3">
        <StatusBadge label={CYCLE_LABELS[item.billing_cycle] ?? item.billing_cycle} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-sm', dateColor)}>{item.next_date}</span>
          {dueBadge && (
            <span className={cn('font-mono text-xs uppercase', dueBadge.color)}>{dueBadge.label}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-poppins text-xs text-mech-ink-50">
          {/* account/card name not joined — show id shorthand */}
          {item.account_id ? 'Account' : item.credit_card_id ? 'Card' : '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          label={STATUS_LABELS[item.status] ?? item.status}
          variant={STATUS_VARIANTS[item.status] ?? 'default'}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {item.status === 'active' && (isOverdue || isDueToday) && (
            <button
              onClick={onConfirm}
              className="px-2.5 py-1 font-grotesk text-xs bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-instant"
            >
              Confirm
            </button>
          )}
          {item.status === 'active' && (isOverdue || isDueToday) && (
            <button onClick={onSkip} className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">
              Skip
            </button>
          )}
          {item.status === 'active' && !isOverdue && !isDueToday && (
            <>
              <button onClick={onEdit}  className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">Edit</button>
              <button onClick={onPause} className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">Pause</button>
              <button onClick={onArchive} className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-signal-red transition-colors duration-instant">Archive</button>
            </>
          )}
          {item.status === 'active' && (isOverdue || isDueToday) && (
            <button onClick={onEdit} className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">Edit</button>
          )}
          {item.status === 'paused' && (
            <>
              <button onClick={onResume}  className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">Resume</button>
              <button onClick={onEdit}    className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">Edit</button>
              <button onClick={onArchive} className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-signal-red transition-colors duration-instant">Archive</button>
            </>
          )}
          {item.status === 'inactive' && (
            <button onClick={onRestore} className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant">Restore</button>
          )}
        </div>
      </td>
    </tr>
  )
}

function RecurringFormDialog({
  open, onOpenChange, editTarget, onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: RecurringPayment | null
  onSubmit: (values: RecurringFormValues) => Promise<void>
}) {
  const { categories }     = useCategories()
  const { activeAccounts } = useAccounts()
  const { activeCards }    = useCreditCards()

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      name: '', amount: 0, billing_cycle: 'monthly',
      next_date: format(new Date(), 'yyyy-MM-dd'),
      category_id: '', account_id: '', credit_card_id: '', auto_log: false,
    },
  })

  useEffect(() => {
    if (open && editTarget) {
      form.reset({
        name:           editTarget.name,
        amount:         Number(editTarget.amount),
        billing_cycle:  editTarget.billing_cycle,
        next_date:      editTarget.next_date,
        category_id:    editTarget.category_id    ?? '',
        account_id:     editTarget.account_id     ?? '',
        credit_card_id: editTarget.credit_card_id ?? '',
        auto_log:       editTarget.auto_log,
      })
    } else if (open) {
      form.reset({ name: '', amount: 0, billing_cycle: 'monthly', next_date: format(new Date(), 'yyyy-MM-dd'), category_id: '', account_id: '', credit_card_id: '', auto_log: false })
    }
  }, [open, editTarget])

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[480px] sm:max-w-[480px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-mech-ink-20">
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">
            {editTarget ? 'Edit Recurring' : 'Add Recurring Payment'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] px-6 py-4">
          <form id="recurring-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Name" required tooltip="E.g. 'Spotify', 'Netflix', 'Gym Membership', 'Internet Bill'" />
              <input
                {...form.register('name')}
                className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50"
                placeholder="Subscription name"
                autoFocus
              />
              {form.formState.errors.name && <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.name.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Amount" required tooltip="The usual amount. You can adjust per confirmation if it changes." />
                <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                  <span className="px-2 py-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none bg-mech-paper-secondary flex-shrink-0">LKR</span>
                  <input
                    type="number" min="0" step="0.01"
                    {...form.register('amount')}
                    className="flex-1 px-2 py-2 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                  />
                </div>
                {form.formState.errors.amount && <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.amount.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Next Due Date" required tooltip="The next date this payment is due. Advances automatically on each confirmation." />
                <input
                  type="date"
                  {...form.register('next_date')}
                  className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Billing Cycle" required tooltip="How often this payment occurs." />
              <div className="grid grid-cols-3 gap-2">
                {(['monthly', 'quarterly', 'yearly'] as const).map((c) => (
                  <label
                    key={c}
                    className={cn(
                      'flex items-center justify-center py-2 border cursor-pointer font-grotesk text-xs transition-colors duration-instant',
                      form.watch('billing_cycle') === c
                        ? 'border-2 border-mech-dark bg-mech-dark text-mech-paper'
                        : 'border border-mech-ink-20 text-mech-ink-80 hover:border-mech-dark'
                    )}
                  >
                    <input type="radio" value={c} {...form.register('billing_cycle')} className="sr-only" />
                    {CYCLE_LABELS[c]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Category" tooltip="Category for the transaction logged on confirmation." />
                <select {...form.register('category_id')} className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant">
                  <option value="">None</option>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Account / Card" tooltip="Which account or card this payment is charged to." />
                <select {...form.register('account_id')} className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant">
                  <option value="">None</option>
                  <optgroup label="Accounts">
                    {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </optgroup>
                  <optgroup label="Credit Cards">
                    {activeCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between border border-mech-ink-20 px-3 py-2.5">
              <div>
                <span className="font-grotesk text-sm text-mech-dark block">Auto Log</span>
                <span className="font-poppins text-xs text-mech-ink-50">Log automatically on due date without confirmation</span>
              </div>
              <Switch checked={form.watch('auto_log')} onCheckedChange={(v) => form.setValue('auto_log', v)} />
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-mech-ink-20 flex gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2 font-grotesk text-sm border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 transition-colors duration-instant">Cancel</button>
          <button type="submit" form="recurring-form" disabled={form.formState.isSubmitting} className="flex-1 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast disabled:opacity-50">
            {form.formState.isSubmitting ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Payment'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmPaymentDialog({
  open, onOpenChange, recurring, onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  recurring: RecurringPayment
  onConfirm: (values: ConfirmFormValues) => Promise<void>
}) {
  const { activeAccounts } = useAccounts()
  const { activeCards }    = useCreditCards()

  const form = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      amount:          Number(recurring.amount),
      date:            format(new Date(), 'yyyy-MM-dd'),
      account_id:      recurring.account_id      ?? '',
      credit_card_id:  recurring.credit_card_id  ?? '',
      notes:           '',
      updateRecurring: false,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        amount: Number(recurring.amount), date: format(new Date(), 'yyyy-MM-dd'),
        account_id: recurring.account_id ?? '', credit_card_id: recurring.credit_card_id ?? '',
        notes: '', updateRecurring: false,
      })
    }
  }, [open, recurring.id])

  const watchedAmount   = form.watch('amount')
  const amountChanged   = Number(watchedAmount) !== Number(recurring.amount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[440px] sm:max-w-[440px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">
            Confirm Payment — {recurring.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onConfirm)} className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Amount" required tooltip="Confirm the amount. If the price changed, check 'Update recurring record too'." />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-2 py-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none bg-mech-paper-secondary flex-shrink-0">LKR</span>
                <input
                  type="number" min="0.01" step="0.01"
                  {...form.register('amount')}
                  className="flex-1 px-2 py-2 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {form.formState.errors.amount && <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.amount.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Date" required tooltip="Date of payment." />
              <input type="date" {...form.register('date')} className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant" />
            </div>
          </div>

          {amountChanged && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...form.register('updateRecurring')} className="w-4 h-4 accent-mech-dark" />
              <span className="font-poppins text-sm text-mech-ink-80">Update recurring record to {formatCurrency(Number(watchedAmount))} too</span>
            </label>
          )}

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Account / Card" tooltip="Account or card this payment is charged to." />
            <select {...form.register('account_id')} className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant">
              <option value="">None</option>
              <optgroup label="Accounts">{activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
              <optgroup label="Cards">{activeCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Notes" tooltip="Optional note for this payment." />
            <input {...form.register('notes')} className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50" placeholder="Optional..." />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2 font-grotesk text-sm border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 transition-colors duration-instant">Cancel</button>
            <button type="submit" disabled={form.formState.isSubmitting} className="flex-1 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast disabled:opacity-50">
              {form.formState.isSubmitting ? 'Confirming...' : 'Confirm & Log →'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SkipPaymentDialog({
  open, onOpenChange, recurring, onSkip,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  recurring: RecurringPayment
  onSkip: (values: SkipFormValues) => Promise<void>
}) {
  const { next_date, billing_cycle } = recurring
  const { format: fmt, addMonths: am, addYears: ay, parseISO: pi } = { format, addMonths, addYears, parseISO: (s: string) => new Date(s) }
  const nextAdvanced = billing_cycle === 'yearly'
    ? format(addDays(new Date(next_date), 365), 'yyyy-MM-dd')
    : billing_cycle === 'quarterly'
      ? format(addDays(new Date(next_date), 91), 'yyyy-MM-dd')
      : format(addDays(new Date(next_date), 30), 'yyyy-MM-dd')

  const form = useForm<SkipFormValues>({ resolver: zodResolver(skipSchema), defaultValues: { reason: '' } })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[400px] sm:max-w-[400px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">Skip Payment — {recurring.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSkip)} className="flex flex-col gap-4 pt-1">
          <p className="font-poppins text-sm text-mech-ink-50">
            Skipping will advance the next due date to <span className="font-mono text-mech-dark">{nextAdvanced}</span> without logging a transaction.
          </p>
          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Reason" tooltip="Optional note for why this payment was skipped." />
            <input {...form.register('reason')} className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50" placeholder="Optional..." />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2 font-grotesk text-sm border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 transition-colors duration-instant">Cancel</button>
            <button type="submit" disabled={form.formState.isSubmitting} className="flex-1 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast disabled:opacity-50">
              {form.formState.isSubmitting ? 'Skipping...' : 'Skip This Month'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
