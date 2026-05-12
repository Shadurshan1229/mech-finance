/** TypeScript interfaces for all 15 MECH Finance database tables. */

export interface Account {
  id: string
  user_id: string
  name: string
  type: 'cash' | 'bank' | 'ewallet' | 'savings'
  currency: string
  initial_amount: number
  color: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreditCard {
  id: string
  user_id: string
  name: string
  bank: string | null
  last_four: string | null
  credit_limit: number
  billing_date: number | null
  due_date: number | null
  currency: string
  color: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'expense' | 'income' | 'both'
  icon: string | null
  color: string | null
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string
  notes: string | null
  category_id: string | null
  account_id: string | null
  credit_card_id: string | null
  occasion: string | null
  is_recurring: boolean
  recurring_id: string | null
  receipt_url: string | null
  ai_categorized: boolean
  created_at: string
  updated_at: string
}

export interface Transfer {
  id: string
  user_id: string
  amount: number
  date: string
  notes: string | null
  from_account_id: string | null
  from_card_id: string | null
  to_account_id: string | null
  to_card_id: string | null
  to_goal_id: string | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  month: string
  amount: number
  rollover: boolean
  created_at: string
}

export interface RecurringPayment {
  id: string
  user_id: string
  name: string
  amount: number
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  next_date: string
  category_id: string | null
  account_id: string | null
  credit_card_id: string | null
  status: 'active' | 'inactive'
  auto_log: boolean
  created_at: string
}

export interface CreditDebt {
  id: string
  user_id: string
  type: 'i_owe' | 'they_owe'
  person: string
  amount: number
  remaining: number
  date: string
  due_date: string | null
  reason: string | null
  status: 'pending' | 'partial' | 'settled'
  linked_account_id: string | null
  created_at: string
  updated_at: string
}

export interface CreditDebtPayment {
  id: string
  credit_debt_id: string
  amount: number
  date: string
  notes: string | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  initial_amount: number
  target_date: string | null
  icon: string | null
  color: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface PortfolioAsset {
  id: string
  user_id: string
  name: string
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'valuables' | 'business' | 'other'
  description: string | null
  currency: string
  is_active: boolean
  created_at: string
}

export interface PortfolioAssetSnapshot {
  id: string
  asset_id: string
  value: number
  date: string
  note: string | null
  created_at: string
}

export interface PortfolioLiability {
  id: string
  user_id: string
  name: string
  type: 'bank_loan' | 'mortgage' | 'credit_card_debt' | 'hire_purchase' | 'other'
  original_amount: number
  description: string | null
  start_date: string | null
  is_active: boolean
  created_at: string
}

export interface PortfolioLiabilitySnapshot {
  id: string
  liability_id: string
  balance: number
  date: string
  note: string | null
  created_at: string
}

export interface AccountBalanceSnapshot {
  id: string
  account_id: string
  balance: number
  date: string
  created_at: string
}

// Convenience join types used in UI
export interface TransactionWithRefs extends Transaction {
  category?: Category
  account?: Account
  credit_card?: CreditCard
}

export interface BudgetWithCategory extends Budget {
  category?: Category
  spent?: number
}

export interface TransferWithRefs extends Transfer {
  from_account?: { id: string; name: string; type: string } | null
  to_account?: { id: string; name: string; type: string } | null
  to_card?: { id: string; name: string } | null
  to_goal?: { id: string; name: string } | null
}
