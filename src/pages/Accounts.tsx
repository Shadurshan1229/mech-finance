import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Wallet, Plus, Edit2, Archive, RotateCcw,
  Building2, CreditCard as CardIcon, PiggyBank, Banknote, Landmark, Smartphone, Coins,
  ArrowDownToLine, ArrowLeftRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import PageHeader from '@/components/layout/PageHeader'
import AmountDisplay from '@/components/shared/AmountDisplay'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import FieldTooltip from '@/components/shared/FieldTooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { WithdrawCashDialog } from '@/components/forms/WithdrawCashDialog'
import { TransferDialog } from '@/components/forms/TransferDialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAccounts } from '@/hooks/useAccounts'
import type { AccountWithBalance } from '@/hooks/useAccounts'
import { cn } from '@/lib/utils'
import { ACCOUNT_TYPES } from '@/lib/constants'

const ACCOUNT_ICONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'wallet',      label: 'Wallet',     icon: Wallet },
  { value: 'building-2',  label: 'Bank',       icon: Building2 },
  { value: 'credit-card', label: 'Card',       icon: CardIcon },
  { value: 'piggy-bank',  label: 'Piggy Bank', icon: PiggyBank },
  { value: 'banknote',    label: 'Banknote',   icon: Banknote },
  { value: 'landmark',    label: 'Landmark',   icon: Landmark },
  { value: 'smartphone',  label: 'Phone',      icon: Smartphone },
  { value: 'coins',       label: 'Coins',      icon: Coins },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ACCOUNT_ICONS.map((i) => [i.value, i.icon])
)

const ACCOUNT_COLORS = [
  '#1D1A19', '#FF5B24', '#2ECC71', '#3498DB',
  '#9B59B6', '#E74C3C',
]

const TYPE_LABELS: Record<string, string> = {
  cash:    'Cash',
  bank:    'Bank',
  ewallet: 'E-Wallet',
  savings: 'Savings',
}

const accountSchema = z.object({
  name:           z.string().min(2, 'Min 2 characters').max(50, 'Max 50 characters'),
  type:           z.enum(ACCOUNT_TYPES),
  initial_amount: z.coerce.number().min(0, 'Must be 0 or more').max(999999999, 'Too large'),
  color:          z.string().optional(),
  icon:           z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountSchema>

/** Accounts page — full CRUD for cash, bank, e-wallet, and savings accounts. */
export default function Accounts() {
  const { activeAccounts, archivedAccounts, totalBalance, isLoading,
          createAccount, updateAccount, archiveAccount, restoreAccount } = useAccounts()

  const [dialogOpen, setDialogOpen]         = useState(false)
  const [editTarget, setEditTarget]         = useState<AccountWithBalance | null>(null)
  const [archiveTarget, setArchiveTarget]   = useState<AccountWithBalance | null>(null)
  const [showArchived, setShowArchived]     = useState(false)
  const [withdrawAccount, setWithdrawAccount] = useState<AccountWithBalance | null>(null)
  const [transferAccount, setTransferAccount] = useState<AccountWithBalance | null>(null)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', type: 'bank', initial_amount: 0, color: '#1D1A19', icon: 'wallet' },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', type: 'bank', initial_amount: 0, color: '#1D1A19', icon: 'wallet' })
    setDialogOpen(true)
  }

  function openEdit(account: AccountWithBalance) {
    setEditTarget(account)
    form.reset({
      name:           account.name,
      type:           account.type,
      initial_amount: Number(account.initial_amount),
      color:          account.color ?? '#1D1A19',
      icon:           account.icon  ?? 'wallet',
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: AccountFormValues) {
    if (editTarget) {
      await updateAccount.mutateAsync({ id: editTarget.id, ...values })
      toast.success('Account updated')
    } else {
      await createAccount.mutateAsync(values)
      toast.success('Account created')
    }
    setDialogOpen(false)
  }

  async function handleArchive() {
    if (!archiveTarget) return
    await archiveAccount.mutateAsync(archiveTarget.id)
    toast.success('Account archived')
    setArchiveTarget(null)
  }

  const isPending = createAccount.isPending || updateAccount.isPending

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your cash, bank, and e-wallet accounts"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-mech-orange text-white font-grotesk font-medium text-sm tracking-[0.01em] border-2 border-mech-orange rounded-none transition-colors duration-fast hover:opacity-90"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Account
          </button>
        }
      />

      {/* Total balance strip */}
      {activeAccounts.length > 0 && (
        <div className="mb-8 p-5 bg-mech-paper-secondary border border-mech-ink-20">
          <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-1">
            TOTAL BALANCE
          </span>
          <AmountDisplay amount={totalBalance} size="lg" />
        </div>
      )}

      {/* Account cards */}
      {isLoading ? (
        <div className="font-poppins text-body-md text-mech-ink-50 py-8">Loading accounts...</div>
      ) : activeAccounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first account to start tracking your money."
          action={{ label: '+ Add Account', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {activeAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEdit(account)}
              onArchive={() => setArchiveTarget(account)}
              onWithdraw={account.type !== 'cash' ? () => setWithdrawAccount(account) : undefined}
              onTransfer={() => setTransferAccount(account)}
            />
          ))}
        </div>
      )}

      {/* Archived toggle */}
      {archivedAccounts.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="font-grotesk text-sm text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant underline"
          >
            {showArchived ? 'Hide archived' : `Show archived (${archivedAccounts.length})`}
          </button>

          {showArchived && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedAccounts.map((account) => (
                <div key={account.id} className="relative opacity-60">
                  <AccountCard account={account} onEdit={() => openEdit(account)} />
                  <button
                    onClick={async () => {
                      await restoreAccount.mutateAsync(account.id)
                      toast.success('Account restored')
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark border border-mech-ink-20 hover:border-mech-dark transition-colors duration-instant"
                  >
                    <RotateCcw size={12} strokeWidth={1.5} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[480px] bg-mech-paper border border-mech-ink-20 rounded-none p-6 gap-0">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-grotesk text-display-md text-mech-dark">
              {editTarget ? 'Edit Account' : 'Add Account'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip
                label="Name"
                required
                tooltip="Give your account a clear name. E.g. 'BOC Savings', 'Cash Wallet', 'Sampath Checking'"
              />
              <input
                {...form.register('name')}
                className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 rounded-none placeholder:text-mech-ink-50 focus:outline-none focus:border-mech-orange transition-colors duration-instant"
                placeholder="My Account"
              />
              {form.formState.errors.name && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.name.message}</span>
              )}
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip
                label="Type"
                required
                tooltip="Account type helps categorise your money. Cash = physical money. Bank = bank account. E-Wallet = Paytm/PayPal style. Savings = dedicated savings account."
              />
              <div className="grid grid-cols-4 gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <label
                    key={t}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-1 border cursor-pointer font-grotesk text-xs transition-colors duration-instant',
                      form.watch('type') === t
                        ? 'border-2 border-mech-dark bg-mech-dark text-mech-paper'
                        : 'border border-mech-ink-20 text-mech-ink-80 hover:border-mech-dark'
                    )}
                  >
                    <input type="radio" value={t} {...form.register('type')} className="sr-only" />
                    {TYPE_LABELS[t]}
                  </label>
                ))}
              </div>
            </div>

            {/* Initial amount */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip
                label="Initial Amount"
                required
                tooltip="The current balance of this account right now. This is your starting point — all future transactions will be calculated from this."
              />
              <div className="flex items-center border border-mech-ink-20 focus-within:border-mech-orange transition-colors duration-instant">
                <span className="px-3 py-2.5 font-mono text-sm text-mech-ink-50 border-r border-mech-ink-20 bg-mech-paper-secondary">
                  LKR
                </span>
                <input
                  {...form.register('initial_amount')}
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2.5 bg-mech-paper text-mech-dark font-mono text-sm rounded-none outline-none placeholder:text-mech-ink-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
              {form.formState.errors.initial_amount && (
                <span className="font-poppins text-xs text-mech-signal-red">{form.formState.errors.initial_amount.message}</span>
              )}
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip
                label="Color"
                tooltip="A colour to identify this account at a glance across the app."
              />
              <div className="flex gap-2">
                {ACCOUNT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setValue('color', c)}
                    className={cn(
                      'w-8 h-8 rounded-none border-2 transition-colors duration-instant',
                      form.watch('color') === c ? 'border-mech-dark' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div className="flex flex-col gap-1.5">
              <FieldTooltip
                label="Icon"
                tooltip="An icon shown on the account card."
              />
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_ICONS.map((ic) => {
                  const Icon = ic.icon
                  return (
                    <button
                      key={ic.value}
                      type="button"
                      title={ic.label}
                      onClick={() => form.setValue('icon', ic.value)}
                      className={cn(
                        'w-9 h-9 flex items-center justify-center border rounded-none transition-colors duration-instant',
                        form.watch('icon') === ic.value
                          ? 'border-mech-dark bg-mech-dark text-mech-paper'
                          : 'border-mech-ink-20 text-mech-ink-80 hover:border-mech-dark'
                      )}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                    </button>
                  )
                })}
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
                {isPending ? 'Working...' : editTarget ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive account?"
        description={`"${archiveTarget?.name}" will be hidden from your active accounts. You can restore it later.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        loading={archiveAccount.isPending}
      />

      <WithdrawCashDialog
        open={!!withdrawAccount}
        onOpenChange={(v) => !v && setWithdrawAccount(null)}
        defaultFromId={withdrawAccount?.id}
      />

      <TransferDialog
        open={!!transferAccount}
        onOpenChange={(v) => !v && setTransferAccount(null)}
        defaultFromId={transferAccount?.id}
      />
    </div>
  )
}

interface AccountCardProps {
  account:    AccountWithBalance
  onEdit:     () => void
  onArchive?: () => void
  onWithdraw?: () => void
  onTransfer?: () => void
}

function AccountCard({ account, onEdit, onArchive, onWithdraw, onTransfer }: AccountCardProps) {
  const IconComponent = ICON_MAP[account.icon ?? 'wallet'] ?? Wallet

  return (
    <div
      className="bg-mech-paper-secondary border border-mech-ink-20 rounded-none p-5 hover:border-mech-ink-80 transition-colors duration-instant flex flex-col gap-3"
      style={account.color ? { borderLeftColor: account.color, borderLeftWidth: 3 } : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconComponent size={16} strokeWidth={1.5} className="text-mech-ink-50 flex-shrink-0" />
          <span className="font-grotesk text-display-sm text-mech-dark truncate">{account.name}</span>
        </div>
        <StatusBadge label={TYPE_LABELS[account.type] ?? account.type} variant="default" />
      </div>

      {/* Balance */}
      <div>
        <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-1">
          CURRENT BALANCE
        </span>
        <AmountDisplay amount={account.balance} size="lg" />
      </div>

      {/* Dashed divider */}
      <hr className="border-0 border-t border-dashed border-mech-ink-20" />

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onWithdraw && (
            <button
              onClick={onWithdraw}
              className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
              title="Withdraw Cash"
            >
              <ArrowDownToLine size={12} strokeWidth={1.5} /> Withdraw
            </button>
          )}
          {onTransfer && (
            <button
              onClick={onTransfer}
              className="flex items-center gap-1 font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark transition-colors duration-instant"
              title="Transfer funds"
            >
              <ArrowLeftRight size={12} strokeWidth={1.5} /> Transfer
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
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
    </div>
  )
}
