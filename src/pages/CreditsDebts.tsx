import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

import PageHeader from '@/components/layout/PageHeader'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useCreditsDebts, getPaymentHistory } from '@/hooks/useCreditsDebts'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CreditDebt, CreditDebtPayment } from '@/types'

const recordSchema = z.object({
  type:              z.enum(['i_owe', 'they_owe']),
  person:            z.string().min(1, 'Required').max(100),
  amount:            z.coerce.number().positive('Must be positive'),
  date:              z.string().min(1, 'Required'),
  due_date:          z.string().optional(),
  reason:            z.string().optional(),
  linked_account_id: z.string().optional(),
})

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Must be positive'),
  date:   z.string().min(1, 'Required'),
  notes:  z.string().optional(),
})

type RecordFormValues  = z.infer<typeof recordSchema>
type PaymentFormValues = z.infer<typeof paymentSchema>

type TabKey = 'i_owe' | 'they_owe' | 'settled'

/** Credits & Debts page — tracks informal money owed to/from people. */
export default function CreditsDebts() {
  const [activeTab, setActiveTab]         = useState<TabKey>('i_owe')
  const [addOpen, setAddOpen]             = useState(false)
  const [defaultType, setDefaultType]     = useState<'i_owe' | 'they_owe'>('i_owe')
  const [payTarget, setPayTarget]         = useState<CreditDebt | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<CreditDebt | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { iOwe, theyOwe, settled, totalOwed, totalOwedTo, isLoading, createRecord, deleteRecord, settleRecord } = useCreditsDebts()

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'i_owe',    label: 'I Owe',    count: iOwe.filter((r) => r.status !== 'settled').length },
    { key: 'they_owe', label: 'They Owe', count: theyOwe.filter((r) => r.status !== 'settled').length },
    { key: 'settled',  label: 'Settled',  count: settled.length },
  ]

  const visibleRecords = activeTab === 'i_owe'
    ? iOwe.filter((r) => r.status !== 'settled')
    : activeTab === 'they_owe'
      ? theyOwe.filter((r) => r.status !== 'settled')
      : settled

  function openAdd(type: 'i_owe' | 'they_owe') {
    setDefaultType(type)
    setAddOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteRecord.mutateAsync(deleteTarget.id)
      toast.success('Record deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Credits & Debts"
        actions={
          <button
            onClick={() => openAdd(activeTab === 'they_owe' ? 'they_owe' : 'i_owe')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-grotesk text-xs bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
          >
            <Plus size={12} strokeWidth={1.5} />
            Add Record
          </button>
        }
      />

      {/* Summary strip */}
      {!isLoading && (
        <div className="grid grid-cols-2 border border-mech-ink-20 mb-6">
          <div className="px-4 py-3 border-r border-mech-ink-20">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-1">I OWE</div>
            <div className="font-mono text-sm font-medium text-mech-signal-red">{formatCurrency(totalOwed)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-1">OWED TO ME</div>
            <div className="font-mono text-sm font-medium text-mech-signal-green">{formatCurrency(totalOwedTo)}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-mech-ink-20 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 font-grotesk text-sm border-b-2 transition-colors duration-instant',
              activeTab === tab.key
                ? 'border-mech-orange text-mech-dark'
                : 'border-transparent text-mech-ink-50 hover:text-mech-dark'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 font-mono text-xs text-mech-ink-50">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading...</div>
      ) : visibleRecords.length === 0 ? (
        <div className="border border-dashed border-mech-ink-20 py-10 text-center">
          <p className="font-poppins text-body-md text-mech-ink-50 mb-3">
            {activeTab === 'settled' ? 'No settled records.' : 'Nothing here yet.'}
          </p>
          {activeTab !== 'settled' && (
            <button
              onClick={() => openAdd(activeTab === 'they_owe' ? 'they_owe' : 'i_owe')}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-grotesk text-sm bg-mech-dark text-mech-paper border border-mech-dark hover:bg-mech-ink-80 transition-colors duration-fast"
            >
              <Plus size={14} strokeWidth={1.5} />
              Add Record
            </button>
          )}
        </div>
      ) : (
        <div className="border border-mech-ink-20 divide-y divide-mech-ink-20">
          {visibleRecords.map((record) => (
            <DebtRow
              key={record.id}
              record={record}
              onPay={() => setPayTarget(record)}
              onSettle={() => {
                settleRecord.mutateAsync(record.id).then(() => toast.success('Marked as settled'))
              }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Add record dialog */}
      <AddRecordDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultType={defaultType}
        onSubmit={async (values) => {
          await createRecord.mutateAsync({
            ...values,
            due_date:          values.due_date          || null,
            reason:            values.reason            || null,
            linked_account_id: values.linked_account_id || null,
          })
          toast.success('Record added')
          setAddOpen(false)
        }}
      />

      {/* Log payment dialog */}
      {payTarget && (
        <LogPaymentDialog
          open={!!payTarget}
          onOpenChange={(v) => !v && setPayTarget(null)}
          record={payTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete record?"
        description={`This will permanently delete the record with ${deleteTarget?.person}. Payment history will also be removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}

function DebtRow({
  record, onPay, onSettle, onDelete,
}: {
  record: CreditDebt
  onPay: () => void
  onSettle: () => void
  onDelete: () => void
}) {
  const isSettled  = record.status === 'settled'
  const pctPaid    = record.amount > 0 ? Math.min(((Number(record.amount) - Number(record.remaining)) / Number(record.amount)) * 100, 100) : 0
  const segments   = 30
  const filled     = Math.round((pctPaid / 100) * segments)

  return (
    <div className="px-4 py-3 flex flex-col gap-2 hover:bg-mech-paper-secondary transition-colors duration-instant">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-grotesk text-sm text-mech-dark truncate">{record.person}</span>
          <StatusBadge status={record.status === 'pending' ? 'pending' : record.status === 'partial' ? 'partial' : 'settled'} />
          {record.due_date && !isSettled && (
            <span className="font-mono text-xs text-mech-ink-50">{record.due_date}</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className={cn('font-mono text-sm font-medium', record.type === 'i_owe' ? 'text-mech-signal-red' : 'text-mech-signal-green')}>
              {formatCurrency(Number(record.remaining))}
            </div>
            {record.remaining !== record.amount && (
              <div className="font-mono text-xs text-mech-ink-50">of {formatCurrency(Number(record.amount))}</div>
            )}
          </div>
          {!isSettled && (
            <>
              <button
                onClick={onPay}
                className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
              >
                Log Payment
              </button>
              <button
                onClick={onSettle}
                className="inline-flex items-center gap-0.5 font-grotesk text-xs text-mech-signal-green hover:opacity-80 transition-opacity duration-instant"
              >
                <Check size={11} strokeWidth={1.5} /> Settle
              </button>
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

      {record.reason && (
        <p className="font-poppins text-xs text-mech-ink-50">{record.reason}</p>
      )}

      {!isSettled && Number(record.amount) > 0 && (
        <div className="flex gap-px h-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: 0,
                background: i < filled ? '#2ECC71' : '#D4C8C2',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AddRecordDialog({
  open, onOpenChange, defaultType, onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultType: 'i_owe' | 'they_owe'
  onSubmit: (values: RecordFormValues) => Promise<void>
}) {
  const { activeAccounts } = useAccounts()
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      type:   defaultType,
      date:   new Date().toISOString().slice(0, 10),
    },
  })

  // Sync defaultType when dialog opens
  useState(() => { form.setValue('type', defaultType) })

  async function handleSubmit(values: RecordFormValues) {
    await onSubmit(values)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[480px] sm:max-w-[480px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">Add Credit / Debt Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 pt-2">

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Type" required tooltip="I Owe = money you borrowed. They Owe = money owed to you." />
            <select
              {...form.register('type')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
            >
              <option value="i_owe">I Owe (I borrowed)</option>
              <option value="they_owe">They Owe (lent to them)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Person" required tooltip="Name of the person." />
            <input
              {...form.register('person')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50"
              placeholder="Name"
              autoFocus
            />
            {form.formState.errors.person && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.person.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Amount" required tooltip="Total amount." />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none">LKR</span>
                <input
                  type="number"
                  min="0"
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
              <FieldTooltip label="Date" required tooltip="Date of the transaction." />
              <input
                type="date"
                {...form.register('date')}
                className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Due Date" tooltip="Optional repayment deadline." />
              <input
                type="date"
                {...form.register('due_date')}
                className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Linked Account" tooltip="Account used for this transaction." />
              <select
                {...form.register('linked_account_id')}
                className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
              >
                <option value="">None</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Reason" tooltip="What was the money for?" />
            <input
              {...form.register('reason')}
              className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 focus:outline-none focus:border-mech-orange transition-colors duration-instant placeholder:text-mech-ink-50"
              placeholder="e.g. Dinner split, borrowed for rent..."
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
              {form.formState.isSubmitting ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LogPaymentDialog({
  open, onOpenChange, record,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  record: CreditDebt
}) {
  const { logPayment } = useCreditsDebts()
  const [history, setHistory] = useState<CreditDebtPayment[]>([])

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: Number(record.remaining),
      date:   new Date().toISOString().slice(0, 10),
    },
  })

  // Load history on open
  useState(() => {
    getPaymentHistory(record.id).then(setHistory)
  })

  async function handleSubmit(values: PaymentFormValues) {
    try {
      await logPayment.mutateAsync({
        credit_debt_id: record.id,
        amount:         values.amount,
        date:           values.date,
        notes:          values.notes || null,
      })
      toast.success('Payment logged')
      onOpenChange(false)
    } catch {
      toast.error('Failed to log payment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[440px] sm:max-w-[440px] ring-0 shadow-none bg-mech-paper border border-mech-ink-20 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-grotesk font-semibold text-base text-mech-dark">
            Log Payment — {record.person}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-1">
          <div className="mb-4 p-3 bg-mech-paper-secondary border border-mech-ink-20">
            <div className="flex justify-between">
              <span className="font-poppins text-xs text-mech-ink-50">Remaining</span>
              <span className="font-mono text-sm font-medium text-mech-dark">{formatCurrency(Number(record.remaining))}</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Amount" required tooltip="Amount being paid now." />
                <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                  <span className="px-2 font-mono text-xs text-mech-ink-50 border-r border-mech-ink-20 select-none">LKR</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    {...form.register('amount')}
                    className="flex-1 px-2 py-2 bg-mech-paper font-mono text-sm text-mech-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {form.formState.errors.amount && (
                  <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.amount.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Date" required tooltip="Date of payment." />
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

            {history.length > 0 && (
              <div className="border-t border-dashed border-mech-ink-20 pt-3">
                <div className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 mb-2">Payment History</div>
                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                  {history.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="font-mono text-xs text-mech-ink-80">{p.date}</span>
                      <span className="font-mono text-xs text-mech-dark">{formatCurrency(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                {form.formState.isSubmitting ? 'Saving...' : 'Log Payment'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
