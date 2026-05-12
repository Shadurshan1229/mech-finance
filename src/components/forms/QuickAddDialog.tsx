import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ChevronDown, Check, Paperclip } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from '@/components/ui/command'
import FieldTooltip from '@/components/shared/FieldTooltip'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const SESSION_KEY_CATEGORY = 'mech_last_category'
const SESSION_KEY_ACCOUNT  = 'mech_last_account'

const schema = z.object({
  type:           z.enum(['income', 'expense']),
  amount:         z.coerce.number().positive('Amount must be positive').max(99999999, 'Too large'),
  date:           z.string().min(1, 'Required'),
  description:    z.string().min(2, 'Min 2 characters').max(200, 'Max 200 characters'),
  category_id:    z.string().min(1, 'Required'),
  account_id:     z.string().optional(),
  credit_card_id: z.string().optional(),
  occasion:       z.string().optional(),
  notes:          z.string().optional(),
  receipt_url:    z.string().optional(),
}).refine(
  (d) => d.account_id || d.credit_card_id,
  { message: 'Select an account or card', path: ['account_id'] }
)

type FormValues = z.infer<typeof schema>

interface QuickAddDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Primary transaction entry dialog.
 * Opens from topbar CTA button or N keyboard shortcut.
 * Remembers last used account and category per session.
 * Auto-focuses amount field on open.
 */
export default function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const userId  = useAppStore((s) => s.user?.id)
  const qc      = useQueryClient()
  const amountRef = useRef<HTMLInputElement | null>(null)

  const { expenseCategories, incomeCategories } = useCategories()
  const { activeAccounts }                      = useAccounts()
  const { activeCards }                         = useCreditCards()

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [accountOpen,  setAccountOpen]  = useState(false)
  const [receiptName,  setReceiptName]  = useState<string>('')

  // Refs for click-outside detection on custom dropdowns
  const categoryRef = useRef<HTMLDivElement>(null)
  const accountRef  = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type:           'expense',
      amount:         undefined,
      date:           format(new Date(), 'yyyy-MM-dd'),
      description:    '',
      category_id:    sessionStorage.getItem(SESSION_KEY_CATEGORY) ?? '',
      account_id:     sessionStorage.getItem(SESSION_KEY_ACCOUNT) ?? '',
      credit_card_id: '',
      occasion:       '',
      notes:          '',
    },
  })

  const txType = form.watch('type')
  const selectedCategoryId = form.watch('category_id')
  const selectedAccountId  = form.watch('account_id')
  const selectedCardId     = form.watch('credit_card_id')

  const currentCategories = txType === 'income' ? incomeCategories : expenseCategories
  // Deduplicate by id (defensive against StrictMode double-registration)
  const uniqueCategories = currentCategories.filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
  )

  // Auto-focus amount on open
  useEffect(() => {
    if (open) {
      setTimeout(() => amountRef.current?.focus(), 100)
    }
  }, [open])

  // Reset category when type switches if current category is wrong type
  useEffect(() => {
    const catIds = currentCategories.map((c) => c.id)
    if (selectedCategoryId && !catIds.includes(selectedCategoryId)) {
      form.setValue('category_id', '')
    }
  }, [txType, currentCategories, selectedCategoryId, form])

  // Click-outside handler for category dropdown
  useEffect(() => {
    if (!categoryOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [categoryOpen])

  // Click-outside handler for account dropdown
  useEffect(() => {
    if (!accountOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [accountOpen])

  const selectedCategory = uniqueCategories.find((c) => c.id === selectedCategoryId)
  const selectedAccount  = activeAccounts.find((a) => a.id === selectedAccountId)
  const selectedCard     = activeCards.find((c) => c.id === selectedCardId)

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.from('transactions').insert({
      user_id:        userId,
      type:           values.type,
      amount:         values.amount,
      date:           values.date,
      description:    values.description,
      category_id:    values.category_id || null,
      account_id:     values.account_id    || null,
      credit_card_id: values.credit_card_id || null,
      occasion:       values.occasion || null,
      notes:          values.notes    || null,
      receipt_url:    values.receipt_url || null,
    })

    if (error) { toast.error('Failed to add transaction'); return }

    // Remember last used
    if (values.category_id) sessionStorage.setItem(SESSION_KEY_CATEGORY, values.category_id)
    const accountKey = values.account_id || values.credit_card_id || ''
    if (accountKey) sessionStorage.setItem(SESSION_KEY_ACCOUNT, accountKey)

    // Invalidate caches
    await qc.invalidateQueries({ queryKey: ['transactions', userId] })
    await qc.invalidateQueries({ queryKey: ['accounts', userId] })

    toast.success(`Transaction added — LKR ${Number(values.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`)

    // Reset form but keep type/category/account
    form.reset({
      type:           values.type,
      amount:         undefined,
      date:           format(new Date(), 'yyyy-MM-dd'),
      description:    '',
      category_id:    values.category_id,
      account_id:     values.account_id,
      credit_card_id: values.credit_card_id,
      occasion:       '',
      notes:          '',
    })
    setReceiptName('')
    onOpenChange(false)
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[520px] sm:max-w-[520px] bg-mech-paper border border-mech-ink-20 rounded-none p-6 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden ring-0 shadow-none">
        <DialogHeader className="mb-5">
          <DialogTitle className="font-grotesk text-display-md text-mech-dark">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-0 border border-mech-ink-20">
            {(['income', 'expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => form.setValue('type', t)}
                className={cn(
                  'flex-1 py-2.5 font-grotesk font-medium text-sm uppercase tracking-[0.05em] transition-colors duration-fast',
                  txType === t
                    ? 'bg-mech-dark text-mech-paper border-2 border-mech-dark'
                    : 'bg-transparent text-mech-ink-80 border border-transparent hover:text-mech-dark'
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
                {...form.register('amount')}
                ref={(el) => {
                  form.register('amount').ref(el)
                  amountRef.current = el
                }}
                type="number"
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-display-md outline-none placeholder:text-mech-ink-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
            {form.formState.errors.amount && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.amount.message}</span>
            )}
          </div>

          {/* Date + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Date" required />
              <input
                {...form.register('date')}
                type="date"
                className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none focus:outline-none focus:border-mech-orange transition-colors duration-instant"
              />
              {form.formState.errors.date && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.date.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Description" required />
              <input
                {...form.register('description')}
                className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
                placeholder="What was this for?"
              />
              {form.formState.errors.description && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.description.message}</span>
              )}
            </div>
          </div>

          {/* Category combobox */}
          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Category" required />
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <div ref={categoryRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-mech-paper border border-mech-ink-20 rounded-none font-poppins text-sm text-left hover:border-mech-dark transition-colors duration-instant"
                  >
                    <span className={selectedCategory ? 'text-mech-dark' : 'text-mech-ink-50'}>
                      {selectedCategory ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: selectedCategory.color ?? '#D4C8C2' }}
                          />
                          {selectedCategory.name}
                        </span>
                      ) : 'Select category...'}
                    </span>
                    <ChevronDown size={16} strokeWidth={1.5} className="text-mech-ink-50 flex-shrink-0" />
                  </button>
                  {categoryOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-mech-paper border border-mech-ink-20 shadow-none">
                      <Command>
                        <CommandInput placeholder="Search categories..." className="font-poppins text-sm" />
                        <CommandList>
                          <CommandEmpty className="font-poppins text-sm text-mech-ink-50 py-2 px-3">No categories found.</CommandEmpty>
                          <CommandGroup>
                            {uniqueCategories.map((cat) => (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => {
                                  field.onChange(cat.id)
                                  setCategoryOpen(false)
                                }}
                                className="flex items-center gap-2 font-poppins text-sm cursor-pointer"
                              >
                                <span
                                  className="w-2 h-2 flex-shrink-0 rounded-full"
                                  style={{ backgroundColor: cat.color ?? '#D4C8C2' }}
                                />
                                {cat.name}
                                {field.value === cat.id && <Check size={14} className="ml-auto text-mech-orange" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
              )}
            />
            {form.formState.errors.category_id && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.category_id.message}</span>
            )}
          </div>

          {/* Account / Card combobox */}
          <div className="flex flex-col gap-1.5">
            <FieldTooltip label="Account / Card" required />
            <Controller
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-mech-paper border border-mech-ink-20 rounded-none font-poppins text-sm text-left hover:border-mech-dark transition-colors duration-instant"
                  >
                    <span className={(selectedAccount || selectedCard) ? 'text-mech-dark' : 'text-mech-ink-50'}>
                      {selectedAccount ? selectedAccount.name : selectedCard ? selectedCard.name : 'Select account or card...'}
                    </span>
                    <ChevronDown size={16} strokeWidth={1.5} className="text-mech-ink-50 flex-shrink-0" />
                  </button>
                  {accountOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-mech-paper border border-mech-ink-20">
                      <Command>
                        <CommandInput placeholder="Search..." className="font-poppins text-sm" />
                        <CommandList>
                          <CommandEmpty className="font-poppins text-sm text-mech-ink-50 py-2 px-3">None found.</CommandEmpty>
                          {activeAccounts.length > 0 && (
                            <CommandGroup heading="ACCOUNTS">
                              {activeAccounts.map((acc) => (
                                <CommandItem
                                  key={acc.id}
                                  value={acc.name}
                                  onSelect={() => {
                                    field.onChange(acc.id)
                                    form.setValue('credit_card_id', '')
                                    setAccountOpen(false)
                                  }}
                                  className="flex items-center justify-between gap-4 font-poppins text-sm cursor-pointer"
                                >
                                  <span>{acc.name}</span>
                                  <span className="font-mono text-xs text-mech-ink-50 ml-auto">
                                    LKR {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                          {activeCards.length > 0 && (
                            <CommandGroup
                              heading="CREDIT CARDS"
                              className="pt-3 mt-1 border-t border-dashed border-mech-ink-20"
                            >
                              {activeCards.map((card) => (
                                <CommandItem
                                  key={card.id}
                                  value={card.name}
                                  onSelect={() => {
                                    form.setValue('credit_card_id', card.id)
                                    field.onChange('')
                                    setAccountOpen(false)
                                  }}
                                  className="flex items-center justify-between gap-4 font-poppins text-sm cursor-pointer"
                                >
                                  <span>{card.name}</span>
                                  <span className="font-mono text-xs text-mech-ink-50 ml-auto">
                                    {card.bank ?? ''}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
              )}
            />
            {form.formState.errors.account_id && (
              <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.account_id.message}</span>
            )}
          </div>

          {/* Optional fields */}
          <div className="border-t border-dashed border-mech-ink-20 pt-4">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-3">
              Optional
            </span>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Occasion" />
                <input
                  {...form.register('occasion')}
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
                  placeholder="Tag (e.g. Holiday)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldTooltip label="Notes" />
                <textarea
                  {...form.register('notes')}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange transition-colors duration-instant resize-none min-h-[80px]"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            {/* Receipt */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip label="Receipt" />
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-mech-ink-20 cursor-pointer hover:border-mech-dark transition-colors duration-instant w-fit">
                <Paperclip size={14} strokeWidth={1.5} className="text-mech-ink-50" />
                <span className="font-grotesk text-xs text-mech-ink-50">
                  {receiptName ? receiptName : '+ Attach file'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setReceiptName(file.name)
                  }}
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-2 border-t border-dashed border-mech-ink-20 mt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 bg-transparent text-mech-dark font-grotesk font-medium text-sm border border-mech-ink-20 rounded-none hover:border-mech-dark transition-colors duration-fast"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-mech-orange text-white font-grotesk font-medium text-sm border-2 border-mech-orange rounded-none hover:opacity-90 transition-opacity duration-fast disabled:opacity-50"
            >
              {isSubmitting ? 'Working...' : 'Add Transaction →'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Hook to open QuickAddDialog with the N keyboard shortcut. */
export function useQuickAddShortcut(onOpen: () => void) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      onOpen()
    },
    [onOpen]
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
