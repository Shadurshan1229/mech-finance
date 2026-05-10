/** App-wide constants. No React imports. No Supabase imports. */

export const APP_NAME = 'MECH Finance'
export const CURRENCY = 'LKR'
export const CURRENCY_LOCALE = 'en-US'

export const ACCOUNT_TYPES = ['cash', 'bank', 'ewallet', 'savings'] as const
export const TRANSACTION_TYPES = ['income', 'expense'] as const
export const CATEGORY_TYPES = ['expense', 'income', 'both'] as const
export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly'] as const
export const CREDIT_DEBT_TYPES = ['i_owe', 'they_owe'] as const
export const CREDIT_DEBT_STATUSES = ['pending', 'partial', 'settled'] as const
export const RECURRING_STATUSES = ['active', 'inactive'] as const
export const PORTFOLIO_ASSET_TYPES = [
  'cash', 'investment', 'property', 'vehicle', 'valuables', 'business', 'other',
] as const
export const PORTFOLIO_LIABILITY_TYPES = [
  'bank_loan', 'mortgage', 'credit_card_debt', 'hire_purchase', 'other',
] as const

export const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/', icon: 'layout-dashboard' },
      { label: 'Transactions', path: '/transactions', icon: 'arrow-left-right' },
      { label: 'Budgets', path: '/budgets', icon: 'pie-chart' },
    ],
  },
  {
    label: 'ACCOUNTS',
    items: [
      { label: 'Accounts', path: '/accounts', icon: 'wallet' },
      { label: 'Credit Cards', path: '/credit-cards', icon: 'credit-card' },
      { label: 'Credits & Debts', path: '/credits-debts', icon: 'handshake' },
    ],
  },
  {
    label: 'PLANNING',
    items: [
      { label: 'Goals', path: '/goals', icon: 'target' },
      { label: 'Recurring', path: '/recurring', icon: 'repeat' },
    ],
  },
  {
    label: 'PORTFOLIO',
    items: [
      { label: 'Portfolio', path: '/portfolio', icon: 'trending-up' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Settings', path: '/settings', icon: 'settings' },
    ],
  },
] as const
