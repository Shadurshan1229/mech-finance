import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMonths, subMonths } from 'date-fns'
import { toast } from 'sonner'
import { ReceiptText, ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react'

import PageHeader from '@/components/layout/PageHeader'
import AmountDisplay from '@/components/shared/AmountDisplay'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import QuickAddDialog from '@/components/forms/QuickAddDialog'
import { useTransactions, type TransactionWithRefs } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { getMonthLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

const editSchema = z.object({
  type:        z.enum(['income', 'expense']),
  amount:      z.coerce.number().positive('Required').max(99999999),
  date:        z.string().min(1, 'Required'),
  description: z.string().min(2).max(200),
  category_id: z.string().optional(),
  occasion:    z.string().optional(),
  notes:       z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

/** Transactions page — unified income + expense log with filters, month navigator, summary strip, and inline edit. */
export default function Transactions() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [typeFilter, setTypeFilter]     = useState<'income' | 'expense' | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [accountFilter,  setAccountFilter]  = useState('')
  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [page, setPage]                 = useState(0)

  const [editTarget,    setEditTarget]   = useState<TransactionWithRefs | null>(null)
  const [deleteTarget,  setDeleteTarget] = useState<TransactionWithRefs | null>(null)
  const [editOpen,      setEditOpen]     = useState(false)
  const [quickAddOpen,  setQuickAddOpen] = useState(false)

  // Separate account/card select state (encoded as 'acc:<id>' or 'cc:<id>')
  const [accountCardValue, setAccountCardValue] = useState('')

  const now         = new Date()
  const isThisMonth = currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear()

  const filters = useMemo(() => ({
    month:      currentMonth,
    type:       typeFilter as 'income' | 'expense' | '' | undefined,
    categoryId: categoryFilter || undefined,
    accountId:  accountFilter  || undefined,
    search:     search         || undefined,
  }), [currentMonth, typeFilter, categoryFilter, accountFilter, search])

  const { transactions, total, summary, isLoading, updateTransaction, deleteTransaction } =
    useTransactions(filters, page)
  const { categories }     = useCategories()
  const { activeAccounts } = useAccounts()
  const { activeCards }    = useCreditCards()

  // Debounce search
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val)
    const t = setTimeout(() => { setSearch(val); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [])

  function prevMonth() { setCurrentMonth((m) => subMonths(m, 1)); setPage(0) }
  function nextMonth() { if (!isThisMonth) { setCurrentMonth((m) => addMonths(m, 1)); setPage(0) } }

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  function openEdit(tx: TransactionWithRefs) {
    setEditTarget(tx)
    editForm.reset({
      type:        tx.type,
      amount:      Number(tx.amount),
      date:        tx.date,
      description: tx.description,
      category_id: tx.category_id ?? '',
      occasion:    tx.occasion ?? '',
      notes:       tx.notes    ?? '',
    })
    // Encode account/card for the combined select
    if (tx.account_id) setAccountCardValue(`acc:${tx.account_id}`)
    else if (tx.credit_card_id) setAccountCardValue(`cc:${tx.credit_card_id}`)
    else setAccountCardValue('')
    setEditOpen(true)
  }

  async function onEditSubmit(values: EditFormValues) {
    if (!editTarget) return
    // Decode combined account/card select value
    const accountId    = accountCardValue.startsWith('acc:') ? accountCardValue.slice(4) : null
    const creditCardId = accountCardValue.startsWith('cc:')  ? accountCardValue.slice(3) : null

    try {
      await updateTransaction.mutateAsync({
        id:             editTarget.id,
        type:           values.type,
        amount:         values.amount,
        date:           values.date,
        description:    values.description,
        category_id:    values.category_id    || null,
        account_id:     accountId,
        credit_card_id: creditCardId,
        occasion:       values.occasion       || null,
        notes:          values.notes          || null,
      })
      toast.success('Transaction updated')
      setEditOpen(false)
    } catch {
      toast.error('Failed to update transaction')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteTransaction.mutateAsync(deleteTarget.id)
    toast.success('Transaction deleted')
    setDeleteTarget(null)
  }

  // Deduplicate categories shown in filter/edit selects
  const uniqueCategories = categories.filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
  )

  return (
    <div>
      <PageHeader
        title="Transactions"
        actions={
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-mech-orange text-white font-grotesk font-medium text-sm tracking-[0.01em] border-2 border-mech-orange rounded-none hover:opacity-90 transition-opacity duration-fast"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Transaction
          </button>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4 border border-mech-ink-20 bg-mech-paper-secondary px-4 py-2.5">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center text-mech-ink-80 hover:text-mech-dark transition-colors duration-instant"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="font-grotesk font-semibold text-sm text-mech-dark tracking-[0.01em]">
          {getMonthLabel(currentMonth)}
        </span>
        <button
          onClick={nextMonth}
          disabled={isThisMonth}
          className={cn(
            'w-8 h-8 flex items-center justify-center transition-colors duration-instant',
            isThisMonth ? 'text-mech-ink-20 cursor-not-allowed' : 'text-mech-ink-80 hover:text-mech-dark'
          )}
          aria-label="Next month"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as 'income' | 'expense' | ''); setPage(0) }}
          className="px-3 py-2 bg-mech-paper border border-mech-ink-20 rounded-none font-grotesk text-sm text-mech-dark focus:outline-none focus:border-mech-orange"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
          className="px-3 py-2 bg-mech-paper border border-mech-ink-20 rounded-none font-grotesk text-sm text-mech-dark focus:outline-none focus:border-mech-orange"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={accountFilter}
          onChange={(e) => { setAccountFilter(e.target.value); setPage(0) }}
          className="px-3 py-2 bg-mech-paper border border-mech-ink-20 rounded-none font-grotesk text-sm text-mech-dark focus:outline-none focus:border-mech-orange"
        >
          <option value="">All Accounts</option>
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
          {activeCards.map((c) => (
            <option key={c.id} value={c.id}>{c.name} (card)</option>
          ))}
        </select>

        <input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search description..."
          className="px-3 py-2 bg-mech-paper border border-mech-ink-20 rounded-none font-poppins text-sm text-mech-dark placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange flex-1 min-w-40"
        />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-px border border-mech-ink-20 bg-mech-ink-20 mb-6">
        {[
          { label: 'INCOME',  value: summary.income,  type: 'income'  as const },
          { label: 'EXPENSE', value: summary.expense, type: 'expense' as const },
          { label: 'NET',     value: summary.net,     type: summary.net >= 0 ? 'income' as const : 'expense' as const },
        ].map(({ label, value, type }) => (
          <div key={label} className="bg-mech-paper-secondary px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-1">{label}</span>
            <AmountDisplay
              amount={value}
              type={type}
              showSign={label === 'NET'}
              size="md"
            />
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={`No transactions in ${getMonthLabel(currentMonth)}`}
          description="Add your first transaction to get started."
          action={{ label: '+ Add Transaction', onClick: () => setQuickAddOpen(true) }}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-mech-ink-20">
              <thead>
                <tr className="border-b-2 border-mech-dark bg-mech-paper-secondary">
                  {['DATE', 'DESCRIPTION', 'CATEGORY', 'ACCOUNT', 'OCCASION', 'AMOUNT', ''].map((col) => (
                    <th
                      key={col}
                      className={cn(
                        'py-2.5 px-4 font-grotesk font-semibold text-xs uppercase tracking-[0.08em] text-mech-dark',
                        col === 'AMOUNT' ? 'text-right' : 'text-left'
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-mech-ink-20 hover:bg-mech-paper-secondary transition-colors duration-instant cursor-pointer"
                    onClick={() => openEdit(tx)}
                  >
                    <td className="py-3 px-4 font-mono text-mono-sm text-mech-ink-80 whitespace-nowrap">
                      {format(new Date(tx.date), 'dd MMM')}
                    </td>
                    <td className="py-3 px-4 font-poppins text-body-md text-mech-dark max-w-48 truncate">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4">
                      {tx.category ? (
                        <span className="flex items-center gap-1.5 font-grotesk text-label-sm text-mech-ink-80">
                          <span
                            className="w-1.5 h-1.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: tx.category.color ?? '#D4C8C2' }}
                          />
                          {tx.category.name}
                        </span>
                      ) : (
                        <span className="text-mech-ink-20">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-grotesk text-label-sm text-mech-ink-50">
                      {tx.account?.name ?? tx.credit_card?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      {tx.occasion ? (
                        <StatusBadge label={tx.occasion} variant="default" />
                      ) : (
                        <span className="text-mech-ink-20">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <AmountDisplay
                        amount={Number(tx.amount)}
                        type={tx.type}
                        showSign
                        size="md"
                      />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(tx) }}
                          className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
                        >
                          <Edit2 size={12} strokeWidth={1.5} /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(tx) }}
                          className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-signal-red transition-colors duration-instant"
                        >
                          <Trash2 size={12} strokeWidth={1.5} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load more */}
          {transactions.length < total && (
            <div className="mt-4 flex items-center justify-between">
              <span className="font-poppins text-body-sm text-mech-ink-50">
                Showing {transactions.length} of {total} transactions
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 font-grotesk text-sm border border-mech-ink-20 hover:border-mech-dark text-mech-ink-80 transition-colors duration-instant"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {/* Quick Add Dialog (page-level instance so the button in header works) */}
      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* Edit Dialog — center modal, consistent with other pages */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-full max-w-[480px] bg-mech-paper border border-mech-ink-20 rounded-none p-6 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden ring-0 shadow-none">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-grotesk text-display-md text-mech-dark">
              Edit Transaction
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
            {/* Type toggle */}
            <div className="flex gap-0 border border-mech-ink-20">
              {(['income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => editForm.setValue('type', t)}
                  className={cn(
                    'flex-1 py-2.5 font-grotesk font-medium text-sm uppercase tracking-[0.05em] transition-colors duration-fast',
                    editForm.watch('type') === t
                      ? 'bg-mech-dark text-mech-paper border-2 border-mech-dark'
                      : 'bg-transparent text-mech-ink-80'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Amount" required />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-3 py-2.5 font-mono text-sm text-mech-ink-50 border-r border-mech-ink-20 bg-mech-paper-secondary">LKR</span>
                <input
                  {...editForm.register('amount')}
                  type="number"
                  step="0.01"
                  className="flex-1 px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {editForm.formState.errors.amount && (
                <span className="font-poppins text-xs text-mech-signal-red">{editForm.formState.errors.amount.message}</span>
              )}
            </div>

            {/* Date + Description */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Date" required />
                <input
                  {...editForm.register('date')}
                  type="date"
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none focus:outline-none focus:border-mech-orange transition-colors duration-instant"
                />
                {editForm.formState.errors.date && (
                  <span className="font-poppins text-xs text-mech-signal-red">{editForm.formState.errors.date.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Description" required />
                <input
                  {...editForm.register('description')}
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
                />
                {editForm.formState.errors.description && (
                  <span className="font-poppins text-xs text-mech-signal-red">{editForm.formState.errors.description.message}</span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Category" />
              <select
                {...editForm.register('category_id')}
                className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none focus:outline-none focus:border-mech-orange"
              >
                <option value="">Select category...</option>
                {uniqueCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Account / Card — encoded combined select */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Account / Card" />
              <select
                value={accountCardValue}
                onChange={(e) => setAccountCardValue(e.target.value)}
                className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none focus:outline-none focus:border-mech-orange"
              >
                <option value="">Select account or card...</option>
                {activeAccounts.length > 0 && (
                  <optgroup label="ACCOUNTS">
                    {activeAccounts.map((a) => (
                      <option key={a.id} value={`acc:${a.id}`}>{a.name}</option>
                    ))}
                  </optgroup>
                )}
                {activeCards.length > 0 && (
                  <optgroup label="CREDIT CARDS">
                    {activeCards.map((c) => (
                      <option key={c.id} value={`cc:${c.id}`}>{c.name}{c.bank ? ` (${c.bank})` : ''}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Occasion + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Occasion" />
                <input
                  {...editForm.register('occasion')}
                  className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none focus:outline-none focus:border-mech-orange"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Notes" />
                <textarea
                  {...editForm.register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none focus:outline-none focus:border-mech-orange resize-none min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-dashed border-mech-ink-20">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 px-4 py-2.5 bg-transparent text-mech-dark font-grotesk font-medium text-sm border border-mech-ink-20 rounded-none hover:border-mech-dark transition-colors duration-fast"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editForm.formState.isSubmitting}
                className="flex-1 px-4 py-2.5 bg-mech-dark text-mech-paper font-grotesk font-medium text-sm border-2 border-mech-dark rounded-none hover:bg-mech-ink-80 transition-colors duration-fast disabled:opacity-50"
              >
                {editForm.formState.isSubmitting ? 'Working...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete transaction?"
        description={`"${deleteTarget?.description}" for LKR ${Number(deleteTarget?.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteTransaction.isPending}
      />
    </div>
  )
}
