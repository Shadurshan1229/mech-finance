import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges Tailwind class names, resolving conflicts via tailwind-merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a numeric amount as LKR currency string. e.g. 12500 → "LKR 12,500.00" */
export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Computes account balance from initial amount plus all transactions and transfers. */
export function computeAccountBalance(params: {
  initialAmount: number
  income: number
  expense: number
  transferIn: number
  transferOut: number
}): number {
  const { initialAmount, income, expense, transferIn, transferOut } = params
  return initialAmount + income - expense + transferIn - transferOut
}

/** Computes credit card outstanding balance. */
export function computeCCOutstanding(params: {
  totalExpenses: number
  totalPayments: number
}): number {
  return params.totalExpenses - params.totalPayments
}

/** Computes goal current amount. */
export function computeGoalCurrent(params: {
  initialAmount: number
  totalTransfers: number
}): number {
  return params.initialAmount + params.totalTransfers
}

/** Computes goal progress as a percentage (0–100). */
export function computeGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min((current / target) * 100, 100)
}

/** Computes budget remaining amount. */
export function computeBudgetRemaining(budgetAmount: number, spent: number): number {
  return budgetAmount - spent
}

/**
 * Normalizes a recurring payment cost to a monthly equivalent.
 * quarterly → divide by 3, yearly → divide by 12.
 */
export function normalizeRecurringCost(
  amount: number,
  cycle: 'monthly' | 'quarterly' | 'yearly'
): number {
  if (cycle === 'monthly') return amount
  if (cycle === 'quarterly') return amount / 3
  return amount / 12
}

/** Computes net worth from asset values and liability balances. */
export function computeNetWorth(
  assetValues: number[],
  liabilityBalances: number[]
): number {
  const totalAssets = assetValues.reduce((sum, v) => sum + v, 0)
  const totalLiabilities = liabilityBalances.reduce((sum, v) => sum + v, 0)
  return totalAssets - totalLiabilities
}
