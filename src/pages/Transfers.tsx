import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'

import PageHeader from '@/components/layout/PageHeader'
import { useTransferHistory } from '@/hooks/useTransfers'
import { formatCurrency } from '@/lib/utils'
import type { TransferWithRefs } from '@/types'

const TYPE_LABEL: Record<string, string> = {
  'card_payment':     'Card Payment',
  'goal_funding':     'Goal Funding',
  'cash_withdrawal':  'Cash Withdrawal',
  'transfer':         'Transfer',
}

function classifyTransfer(t: TransferWithRefs): string {
  if (t.to_card_id)                            return 'card_payment'
  if (t.to_goal_id)                            return 'goal_funding'
  if (t.to_account?.type === 'cash')           return 'cash_withdrawal'
  return 'transfer'
}

function fromLabel(t: TransferWithRefs): string {
  return t.from_account?.name ?? '—'
}

function toLabel(t: TransferWithRefs): string {
  return t.to_account?.name ?? t.to_card?.name ?? t.to_goal?.name ?? '—'
}

/** Transfers history page — read-only log of all account/card/goal transfers. */
export default function Transfers() {
  const { transfers, isLoading } = useTransferHistory()

  return (
    <div>
      <PageHeader title="Transfers" />

      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading transfers...</div>
      ) : transfers.length === 0 ? (
        <div className="border border-dashed border-mech-ink-20 py-12 text-center">
          <p className="font-poppins text-body-md text-mech-ink-50">
            No transfers yet. Use Withdraw Cash, Transfer, Pay Card, or Fund Goal to move money.
          </p>
        </div>
      ) : (
        <div className="border border-mech-ink-20">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-[120px_140px_1fr_140px] gap-4 px-4 py-2 border-b border-mech-ink-20 bg-mech-paper-secondary">
            <span className="font-grotesk text-xs uppercase tracking-[0.08em] text-mech-ink-50">Date</span>
            <span className="font-grotesk text-xs uppercase tracking-[0.08em] text-mech-ink-50">Type</span>
            <span className="font-grotesk text-xs uppercase tracking-[0.08em] text-mech-ink-50">From → To</span>
            <span className="font-grotesk text-xs uppercase tracking-[0.08em] text-mech-ink-50 text-right">Amount</span>
          </div>

          {transfers.map((t) => (
            <TransferRow key={t.id} transfer={t} />
          ))}
        </div>
      )}
    </div>
  )
}

function TransferRow({ transfer: t }: { transfer: TransferWithRefs }) {
  const kind = classifyTransfer(t)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[120px_140px_1fr_140px] gap-1 md:gap-4 px-4 py-3 border-b border-mech-ink-20 last:border-b-0 hover:bg-mech-paper-secondary transition-colors duration-instant">
      {/* Date */}
      <div className="font-mono text-xs text-mech-ink-50">
        {format(new Date(t.date), 'dd MMM yyyy')}
      </div>

      {/* Type */}
      <div className="font-grotesk text-xs uppercase tracking-[0.08em] text-mech-ink-50">
        {TYPE_LABEL[kind]}
      </div>

      {/* From → To */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-poppins text-sm text-mech-dark truncate">{fromLabel(t)}</span>
        <ArrowRight size={12} strokeWidth={1.5} className="text-mech-ink-30 flex-shrink-0" />
        <span className="font-poppins text-sm text-mech-dark truncate">{toLabel(t)}</span>
      </div>

      {/* Amount */}
      <div className="font-mono text-sm text-mech-dark md:text-right">
        {formatCurrency(Number(t.amount))}
        {t.notes && (
          <span className="block font-poppins text-xs text-mech-ink-50 truncate mt-0.5 md:text-right">{t.notes}</span>
        )}
      </div>
    </div>
  )
}
