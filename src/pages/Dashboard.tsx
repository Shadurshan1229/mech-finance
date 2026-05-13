import { useState } from 'react'
import { format } from 'date-fns'
import { AlertCircle, TrendingUp, TrendingDown, Plus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import QuickAddDialog from '@/components/forms/QuickAddDialog'
import IncomeExpenseBar from '@/components/charts/IncomeExpenseBar'
import SpendingTrend from '@/components/charts/SpendingTrend'
import CategoryDonut from '@/components/charts/CategoryDonut'
import NetWorthLine from '@/components/charts/NetWorthLine'
import BudgetProgressBar from '@/components/charts/BudgetProgressBar'
import { useDashboardCharts } from '@/hooks/useDashboard'
import { useAccounts } from '@/hooks/useAccounts'
import { useBudgets } from '@/hooks/useBudgets'
import { useGoals } from '@/hooks/useGoals'
import { useRecurring } from '@/hooks/useRecurring'
import { useCreditsDebts } from '@/hooks/useCreditsDebts'
import { formatCurrency, cn } from '@/lib/utils'

type ChartTab = 'income_expense' | 'spending_trend' | 'categories' | 'net_worth'

const CHART_TABS: { id: ChartTab; label: string }[] = [
  { id: 'income_expense', label: 'INCOME VS EXPENSE' },
  { id: 'spending_trend', label: 'SPENDING TREND' },
  { id: 'categories',     label: 'CATEGORIES' },
  { id: 'net_worth',      label: 'NET WORTH' },
]

function getBudgetStatus(spent: number, amount: number): 'on_track' | 'warning' | 'over' {
  if (amount <= 0) return 'on_track'
  const pct = spent / amount
  if (pct >= 1) return 'over'
  if (pct >= 0.8) return 'warning'
  return 'on_track'
}

/** Full financial overview: net worth, accounts, charts, budgets, goals, recurring, and credits/debts. */
export default function Dashboard() {
  const [activeTab, setActiveTab]     = useState<ChartTab>('income_expense')
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const {
    incomeExpenseData,
    spendingTrendData,
    categoryData,
    netWorth,
    netWorthDelta,
    hasPortfolioData,
    netWorthTrendData,
    recentTransactions,
  } = useDashboardCharts()

  const { activeAccounts, totalBalance } = useAccounts()
  const { budgets }                      = useBudgets(new Date())
  const { active: activeGoals }          = useGoals()
  const { dueCount, overdue, dueToday, upcoming } = useRecurring()
  const { totalOwed, totalOwedTo }       = useCreditsDebts()

  const currentMonth  = incomeExpenseData[incomeExpenseData.length - 1] ?? { income: 0, expense: 0 }
  const savingsRate   = currentMonth.income > 0
    ? Math.max(0, ((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100)
    : 0

  const topBudgets = [...budgets]
    .filter((b) => (b.spent ?? 0) > 0 || Number(b.amount) > 0)
    .sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0))
    .slice(0, 5)

  const displayGoals       = activeGoals.slice(0, 3)
  const upcomingRecurring  = upcoming.slice(0, 5)

  return (
    <div className="flex flex-col gap-0">
      <PageHeader title="Dashboard" description={format(new Date(), 'MMMM yyyy')} />

      <div className="flex flex-col gap-4">
        {/* Due payments alert */}
        {dueCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 border border-mech-orange">
            <AlertCircle size={16} strokeWidth={1.5} className="text-mech-orange flex-shrink-0" />
            <span className="font-poppins text-sm text-mech-dark flex-1">
              {overdue.length > 0 && `${overdue.length} overdue`}
              {overdue.length > 0 && dueToday.length > 0 && ' · '}
              {dueToday.length > 0 && `${dueToday.length} due today`}
              {' '}— recurring payment{dueCount !== 1 ? 's' : ''} need attention.
            </span>
            <Link
              to="/recurring"
              className="font-grotesk text-xs font-medium text-mech-orange hover:opacity-80 transition-opacity flex-shrink-0"
            >
              REVIEW →
            </Link>
          </div>
        )}

        {/* Net worth banner + month summary */}
        <div className="border border-mech-ink-20 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50 block mb-1">NET WORTH</span>
              {hasPortfolioData ? (
                <>
                  <span className="font-mono text-display-xl text-mech-dark block" data-amount>
                    {formatCurrency(netWorth)}
                  </span>
                  {netWorthDelta !== 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {netWorthDelta > 0
                        ? <TrendingUp  size={13} strokeWidth={1.5} className="text-mech-signal-green" />
                        : <TrendingDown size={13} strokeWidth={1.5} className="text-mech-signal-red" />
                      }
                      <span className={cn('font-mono text-xs', netWorthDelta > 0 ? 'text-mech-signal-green' : 'text-mech-signal-red')}>
                        {netWorthDelta > 0 ? '+' : ''}{formatCurrency(netWorthDelta)} vs last month
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <span className="font-poppins text-sm text-mech-ink-50 block mt-1">
                  Add assets &amp; liabilities in Portfolio to track net worth.
                </span>
              )}
            </div>

            <div className="flex gap-6 flex-shrink-0">
              <div className="text-right">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50 block mb-1">INCOME</span>
                <span className="font-mono text-body-lg text-mech-signal-green" data-amount>
                  {formatCurrency(currentMonth.income)}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50 block mb-1">EXPENSE</span>
                <span className="font-mono text-body-lg text-mech-signal-red" data-amount>
                  {formatCurrency(currentMonth.expense)}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50 block mb-1">SAVINGS</span>
                <span className="font-mono text-body-lg text-mech-dark" data-amount>
                  {savingsRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-mech-ink-20 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50">TOTAL CASH</span>
            <span className="font-mono text-sm text-mech-dark" data-amount>{formatCurrency(totalBalance)}</span>
          </div>
        </div>

        {/* Account balances strip */}
        {activeAccounts.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {activeAccounts.map((acc) => (
                <div key={acc.id} className="border border-mech-ink-20 p-3 min-w-[152px]">
                  <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-1">
                    {acc.type}
                  </span>
                  <span className="font-grotesk text-sm text-mech-dark font-medium block truncate mb-1">
                    {acc.name}
                  </span>
                  <span className="font-mono text-sm text-mech-dark" data-amount>
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content grid: 60/40 split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* LEFT — charts + recent transactions */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Charts tab group */}
            <div className="border border-mech-ink-20">
              <div className="flex border-b border-mech-ink-20 overflow-x-auto">
                {CHART_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-2.5 font-mono text-xs uppercase tracking-[0.08em] border-b-2 flex-shrink-0 transition-colors duration-instant',
                      activeTab === tab.id
                        ? 'border-mech-orange text-mech-dark'
                        : 'border-transparent text-mech-ink-50 hover:text-mech-dark'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === 'income_expense' && (
                  <>
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-3">
                      LAST 6 MONTHS
                    </span>
                    <IncomeExpenseBar data={incomeExpenseData} height={220} />
                  </>
                )}
                {activeTab === 'spending_trend' && (
                  <>
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-3">
                      LAST 30 DAYS
                    </span>
                    <SpendingTrend data={spendingTrendData} height={220} />
                  </>
                )}
                {activeTab === 'categories' && (
                  <>
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-3">
                      THIS MONTH — EXPENSES
                    </span>
                    <CategoryDonut data={categoryData} height={220} />
                  </>
                )}
                {activeTab === 'net_worth' && (
                  <>
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-3">
                      LAST 6 MONTHS
                    </span>
                    <NetWorthLine data={netWorthTrendData} height={220} />
                  </>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="border border-mech-ink-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mech-ink-20">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50">
                  RECENT TRANSACTIONS
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuickAddOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-mech-orange text-white font-grotesk text-xs font-medium border-2 border-mech-orange hover:opacity-90 transition-opacity"
                  >
                    <Plus size={12} strokeWidth={2} />
                    ADD
                  </button>
                  <Link
                    to="/transactions"
                    className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark flex items-center gap-1 transition-colors duration-instant"
                  >
                    VIEW ALL <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="font-poppins text-sm text-mech-ink-50">No transactions yet.</span>
                </div>
              ) : (
                <div className="divide-y divide-mech-ink-20">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="w-2 h-2 flex-shrink-0"
                        style={{ backgroundColor: tx.category?.color ?? '#D4C8C2' }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-poppins text-sm text-mech-dark block truncate">
                          {tx.description}
                        </span>
                        <span className="font-mono text-xs text-mech-ink-50">
                          {format(new Date(tx.date + 'T00:00:00'), 'dd MMM')}
                          {tx.category ? ` · ${tx.category.name}` : ''}
                        </span>
                      </div>
                      <span className={cn(
                        'font-mono text-sm flex-shrink-0',
                        tx.type === 'income' ? 'text-mech-signal-green' : 'text-mech-dark'
                      )}>
                        {tx.type === 'income' ? '+' : '−'}{formatCurrency(Number(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — budget, goals, recurring, credits/debts */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Budget pulse */}
            <div className="border border-mech-ink-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mech-ink-20">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50">BUDGET PULSE</span>
                <Link
                  to="/budgets"
                  className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark flex items-center gap-1 transition-colors duration-instant"
                >
                  VIEW <ArrowRight size={12} />
                </Link>
              </div>
              {topBudgets.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="font-poppins text-sm text-mech-ink-50">No budgets set for this month.</span>
                </div>
              ) : (
                <div className="divide-y divide-mech-ink-20">
                  {topBudgets.map((b) => {
                    const spent  = b.spent ?? 0
                    const budget = Number(b.amount)
                    const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
                    const status = getBudgetStatus(spent, budget)
                    return (
                      <div key={b.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {b.category?.color && (
                              <span
                                className="w-1.5 h-1.5 flex-shrink-0"
                                style={{ backgroundColor: b.category.color }}
                              />
                            )}
                            <span className="font-grotesk text-sm text-mech-dark truncate">
                              {b.category?.name ?? 'Uncategorized'}
                            </span>
                          </div>
                          <span className={cn(
                            'font-mono text-xs flex-shrink-0 ml-2',
                            status === 'over' ? 'text-mech-signal-red' : 'text-mech-ink-50'
                          )}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <BudgetProgressBar percentage={pct} status={status} segments={24} height={5} />
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-xs text-mech-ink-50">{formatCurrency(spent)}</span>
                          <span className="font-mono text-xs text-mech-ink-50">{formatCurrency(budget)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Active goals */}
            <div className="border border-mech-ink-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mech-ink-20">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50">ACTIVE GOALS</span>
                <Link
                  to="/goals"
                  className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark flex items-center gap-1 transition-colors duration-instant"
                >
                  VIEW <ArrowRight size={12} />
                </Link>
              </div>
              {displayGoals.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="font-poppins text-sm text-mech-ink-50">No active goals.</span>
                </div>
              ) : (
                <div className="divide-y divide-mech-ink-20">
                  {displayGoals.map((g) => {
                    const filled = Math.round((g.progress / 100) * 20)
                    return (
                      <div key={g.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-grotesk text-sm text-mech-dark truncate">{g.name}</span>
                          <span className="font-mono text-xs text-mech-ink-50 flex-shrink-0 ml-2">
                            {g.progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex" style={{ gap: '2px' }}>
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: 4,
                                background: i < filled ? (g.color ?? '#FF5B24') : '#D4C8C2',
                                borderRadius: 0,
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-xs text-mech-ink-50">{formatCurrency(g.current)}</span>
                          <span className="font-mono text-xs text-mech-ink-50">{formatCurrency(Number(g.target_amount))}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Upcoming recurring */}
            <div className="border border-mech-ink-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mech-ink-20">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50">UPCOMING RECURRING</span>
                <Link
                  to="/recurring"
                  className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark flex items-center gap-1 transition-colors duration-instant"
                >
                  VIEW <ArrowRight size={12} />
                </Link>
              </div>
              {upcomingRecurring.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="font-poppins text-sm text-mech-ink-50">
                    No payments due in the next 7 days.
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-mech-ink-20">
                  {upcomingRecurring.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-grotesk text-sm text-mech-dark block truncate">{r.name}</span>
                        <span className="font-mono text-xs text-mech-ink-50">
                          {format(new Date(r.next_date + 'T00:00:00'), 'dd MMM')}
                          {' · '}{r.billing_cycle}
                        </span>
                      </div>
                      <span className="font-mono text-sm text-mech-dark flex-shrink-0">
                        {formatCurrency(Number(r.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Credits & debts summary */}
            <div className="border border-mech-ink-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mech-ink-20">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-mech-ink-50">CREDITS & DEBTS</span>
                <Link
                  to="/credits-debts"
                  className="font-grotesk text-xs text-mech-ink-50 hover:text-mech-dark flex items-center gap-1 transition-colors duration-instant"
                >
                  VIEW <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 divide-x divide-mech-ink-20">
                <div className="px-4 py-4">
                  <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-1">I OWE</span>
                  <span className="font-mono text-body-md text-mech-signal-red" data-amount>
                    {formatCurrency(totalOwed)}
                  </span>
                </div>
                <div className="px-4 py-4">
                  <span className="font-mono text-xs uppercase tracking-[0.08em] text-mech-ink-50 block mb-1">OWED TO ME</span>
                  <span className="font-mono text-body-md text-mech-signal-green" data-amount>
                    {formatCurrency(totalOwedTo)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
