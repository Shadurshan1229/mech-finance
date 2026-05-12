import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CreditCard as CreditCardIcon, Plus, Edit2, Archive } from 'lucide-react'

import PageHeader from '@/components/layout/PageHeader'
import AmountDisplay from '@/components/shared/AmountDisplay'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useCreditCards, type CreditCardWithStats } from '@/hooks/useCreditCards'
import { cn } from '@/lib/utils'

const CARD_COLORS = [
  '#1D1A19', '#FF5B24', '#2ECC71', '#3498DB', '#9B59B6', '#E74C3C',
]

const cardSchema = z.object({
  name:         z.string().min(2, 'Min 2 characters').max(50, 'Max 50 characters'),
  bank:         z.string().optional(),
  last_four:    z.string().max(4).regex(/^\d{0,4}$/, 'Must be digits only').optional(),
  credit_limit: z.coerce.number().positive('Must be positive').max(99999999, 'Too large'),
  billing_date: z.string().optional(),
  due_date:     z.string().optional(),
  color:        z.string().optional(),
})

type CardFormValues = z.infer<typeof cardSchema>

function toOptInt(v: string | undefined): number | undefined {
  if (!v || v === '') return undefined
  const n = parseInt(v, 10)
  return isNaN(n) ? undefined : n
}

/** Credit Cards page — card CRUD with outstanding balance, utilization bar, and due date alerts. */
export default function CreditCards() {
  const { activeCards, archivedCards, isLoading, createCard, updateCard, archiveCard } = useCreditCards()

  const [dialogOpen, setDialogOpen]       = useState(false)
  const [editTarget,   setEditTarget]     = useState<CreditCardWithStats | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<CreditCardWithStats | null>(null)
  const [showArchived, setShowArchived]   = useState(false)

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { name: '', bank: '', last_four: '', color: '#1D1A19', billing_date: '', due_date: '' },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', bank: '', last_four: '', color: '#1D1A19', billing_date: '', due_date: '' })
    setDialogOpen(true)
  }

  function openEdit(card: CreditCardWithStats) {
    setEditTarget(card)
    form.reset({
      name:         card.name,
      bank:         card.bank                       ?? '',
      last_four:    card.last_four                  ?? '',
      credit_limit: Number(card.credit_limit),
      billing_date: card.billing_date != null ? String(card.billing_date) : '',
      due_date:     card.due_date     != null ? String(card.due_date)     : '',
      color:        card.color                      ?? '#1D1A19',
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: CardFormValues) {
    const payload = {
      name:         values.name,
      bank:         values.bank      || null,
      last_four:    values.last_four || null,
      credit_limit: values.credit_limit,
      billing_date: toOptInt(values.billing_date) ?? null,
      due_date:     toOptInt(values.due_date)     ?? null,
      color:        values.color || null,
    }
    if (editTarget) {
      await updateCard.mutateAsync({ id: editTarget.id, ...payload })
      toast.success('Card updated')
    } else {
      await createCard.mutateAsync(payload)
      toast.success('Card added')
    }
    setDialogOpen(false)
  }

  async function handleArchive() {
    if (!archiveTarget) return
    await archiveCard.mutateAsync(archiveTarget.id)
    toast.success('Card archived')
    setArchiveTarget(null)
  }

  const isPending = createCard.isPending || updateCard.isPending

  // Summary stats
  const totalOutstanding = activeCards.reduce((s, c) => s + c.outstanding, 0)
  const totalLimit       = activeCards.reduce((s, c) => s + Number(c.credit_limit), 0)
  const overallUtil      = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0

  return (
    <div>
      <PageHeader
        title="Credit Cards"
        description="Track your credit cards, limits, and outstanding balances"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-mech-orange text-white font-grotesk font-medium text-sm tracking-[0.01em] border-2 border-mech-orange rounded-none hover:opacity-90 transition-opacity duration-fast"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Card
          </button>
        }
      />

      {/* Summary strip */}
      {activeCards.length > 0 && (
        <div className="grid grid-cols-3 gap-px border border-mech-ink-20 bg-mech-ink-20 mb-8">
          <div className="bg-mech-paper-secondary px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-1">TOTAL OUTSTANDING</span>
            <AmountDisplay amount={totalOutstanding} type="expense" size="md" />
          </div>
          <div className="bg-mech-paper-secondary px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-1">TOTAL LIMIT</span>
            <AmountDisplay amount={totalLimit} size="md" />
          </div>
          <div className="bg-mech-paper-secondary px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-1">UTILIZATION</span>
            <span className="font-mono text-mono-md text-mech-dark">{overallUtil.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Card grid */}
      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading cards...</div>
      ) : activeCards.length === 0 ? (
        <EmptyState
          icon={CreditCardIcon}
          title="No credit cards yet"
          description="Add a credit card to track outstanding balances and utilization."
          action={{ label: '+ Add Card', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {activeCards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              onEdit={() => openEdit(card)}
              onArchive={() => setArchiveTarget(card)}
            />
          ))}
        </div>
      )}

      {/* Archived toggle */}
      {archivedCards.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="font-grotesk text-sm text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant underline"
          >
            {showArchived ? 'Hide archived' : `Show archived (${archivedCards.length})`}
          </button>
          {showArchived && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
              {archivedCards.map((card) => (
                <CardComponent key={card.id} card={card} onEdit={() => openEdit(card)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[480px] bg-mech-paper border border-mech-ink-20 rounded-none p-6 gap-0">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-grotesk text-display-md text-mech-dark">
              {editTarget ? 'Edit Card' : 'Add Card'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Card Name" required tooltip="A name to identify this card. E.g. 'BOC Visa', 'Sampath Mastercard'" />
              <input
                {...form.register('name')}
                className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange"
                placeholder="BOC Visa"
              />
              {form.formState.errors.name && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.name.message}</span>
              )}
            </div>

            {/* Bank + Last Four */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Bank" tooltip="The bank that issued this card." />
                <input
                  {...form.register('bank')}
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange"
                  placeholder="Bank of Ceylon"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Last 4 Digits" tooltip="Last 4 digits of your card. Used for identification only." />
                <input
                  {...form.register('last_four')}
                  maxLength={4}
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange"
                  placeholder="1234"
                />
                {form.formState.errors.last_four && (
                  <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.last_four.message}</span>
                )}
              </div>
            </div>

            {/* Credit limit */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Credit Limit" required tooltip="Your total approved credit limit on this card in LKR." />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-3 py-2.5 font-mono text-sm text-mech-ink-50 border-r border-mech-ink-20 bg-mech-paper-secondary">LKR</span>
                <input
                  {...form.register('credit_limit')}
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="50000.00"
                />
              </div>
              {form.formState.errors.credit_limit && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.credit_limit.message}</span>
              )}
            </div>

            {/* Billing date + due date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Billing Date" tooltip="Day of the month your billing cycle closes and statement is generated." />
                <input
                  {...form.register('billing_date')}
                  type="number"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="25"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Due Date" tooltip="Day of the month your minimum payment is due. Usually 20–25 days after billing date." />
                <input
                  {...form.register('due_date')}
                  type="number"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="3"
                />
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Color" tooltip="A colour to visually identify this card across the app." />
              <div className="flex gap-2">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setValue('color', c)}
                    className={cn(
                      'w-8 h-8 border-2 transition-colors duration-instant',
                      form.watch('color') === c ? 'border-mech-dark' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-2 border-t border-dashed border-mech-ink-20 mt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex-1 px-4 py-2.5 bg-transparent text-mech-dark font-grotesk font-medium text-sm border border-mech-ink-20 rounded-none hover:border-mech-dark transition-colors duration-fast"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-mech-dark text-mech-paper font-grotesk font-medium text-sm border-2 border-mech-dark rounded-none hover:bg-mech-ink-80 transition-colors duration-fast disabled:opacity-50"
              >
                {isPending ? 'Working...' : editTarget ? 'Save Changes' : 'Add Card'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive card?"
        description={`"${archiveTarget?.name}" will be hidden from your active cards. You can restore it later.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        loading={archiveCard.isPending}
      />
    </div>
  )
}

interface CardComponentProps {
  card:      CreditCardWithStats
  onEdit:    () => void
  onArchive?: () => void
}

function CardComponent({ card, onEdit, onArchive }: CardComponentProps) {
  const today       = new Date()
  const todayDate   = today.getDate()
  const daysUntilDue = card.due_date != null
    ? (card.due_date >= todayDate ? card.due_date - todayDate : card.due_date + 31 - todayDate)
    : null

  const isCritical = daysUntilDue !== null && daysUntilDue <= 3
  const isDueSoon  = daysUntilDue !== null && daysUntilDue <= 7
  const isOverUtil = card.utilization > 80

  const SEGMENTS = 30
  const filled   = Math.round((card.utilization / 100) * SEGMENTS)

  return (
    <div
      className="bg-mech-paper-secondary border border-mech-ink-20 rounded-none p-5 hover:border-mech-ink-80 transition-colors duration-instant flex flex-col gap-3"
      style={card.color ? { borderLeftColor: card.color, borderLeftWidth: 3 } : undefined}
    >
      {/* Bank + name header */}
      <div>
        {card.bank && (
          <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-0.5">
            {card.bank}
          </span>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="font-grotesk text-display-sm text-mech-dark">{card.name}</span>
          {isDueSoon && (
            <StatusBadge
              label={isCritical ? `DUE IN ${daysUntilDue}d` : 'DUE SOON'}
              variant={isCritical ? 'error' : 'signal'}
            />
          )}
        </div>
        {card.last_four && (
          <span className="font-mono text-mono-sm text-mech-ink-50">
            •••• •••• •••• {card.last_four}
          </span>
        )}
      </div>

      <hr className="border-0 border-t border-dashed border-mech-ink-20" />

      {/* Outstanding + Available */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-1">OUTSTANDING</span>
          <AmountDisplay amount={card.outstanding} type="expense" size="md" />
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-1">AVAILABLE</span>
          <AmountDisplay amount={card.available} size="md" />
        </div>
      </div>

      {/* Limit + Utilization bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-poppins text-body-sm text-mech-ink-50">
            Limit: <span className="font-mono">LKR {Number(card.credit_limit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </span>
          <span className="font-mono text-mono-sm text-mech-ink-80">{card.utilization.toFixed(1)}%</span>
        </div>
        {/* Nothing OS segmented progress bar */}
        <div className="flex gap-px h-1.5">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                backgroundColor: i < filled
                  ? (isOverUtil ? '#E74C3C' : '#FF5B24')
                  : '#D4C8C2',
              }}
            />
          ))}
        </div>
      </div>

      {/* Billing + Due dates */}
      {(card.billing_date || card.due_date) && (
        <div className="flex items-center gap-4 font-poppins text-body-sm text-mech-ink-50">
          {card.billing_date && <span>Billing: <span className="font-mono">{card.billing_date}{ordinal(card.billing_date)}</span></span>}
          {card.due_date     && <span>Due: <span className="font-mono">{card.due_date}{ordinal(card.due_date)}</span></span>}
        </div>
      )}

      <hr className="border-0 border-t border-dashed border-mech-ink-20" />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
        >
          <Edit2 size={12} strokeWidth={1.5} /> Edit
        </button>
        {onArchive && (
          <button
            onClick={onArchive}
            className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-signal-red transition-colors duration-instant"
          >
            <Archive size={12} strokeWidth={1.5} /> Archive
          </button>
        )}
      </div>
    </div>
  )
}

function ordinal(n: number): string {
  if (n > 3 && n < 21) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}
