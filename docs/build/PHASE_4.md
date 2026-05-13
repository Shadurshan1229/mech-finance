# Phase 4 — Dashboard & Charts
**Status:** 🔄 In Progress
**Tag:** v0.4.0

## Tasks

### Step 1 — Dashboard page
- [ ] src/hooks/useDashboard.ts — aggregate query: net worth, total income/expense (current month), recent transactions, account balances
- [ ] src/pages/Dashboard.tsx — summary strip (net worth, income, expense, savings rate), recent transactions list, link to charts

### Step 2 — Charts
- [ ] src/components/charts/SpendingByCategory.tsx — Recharts PieChart/RadialBar, expense categories current month
- [ ] src/components/charts/IncomeVsExpense.tsx — Recharts BarChart, last 6 months
- [ ] src/components/charts/NetWorthTrend.tsx — Recharts AreaChart, account_balance_snapshots over time
- [ ] src/components/charts/BudgetOverview.tsx — bar chart of budget vs actual per category

### Step 3 — Recurring Payments page
- [ ] src/hooks/useRecurring.ts — CRUD for recurring_payments table
- [ ] src/pages/Recurring.tsx — list active/inactive recurring payments, add/edit/toggle/delete

### Step 4 — Docs
- [ ] docs/build/PHASES.md — Phase 4 status = ✅ Done
- [ ] docs/build/PHASE_4.md — this file
- [ ] .claude/CLAUDE.md — update active phase pointer to PHASE_5.md

### Smoke test
- [ ] tsc --noEmit passes clean
- [ ] Dashboard renders real data
- [ ] All 4 charts render without errors
- [ ] Recurring payments CRUD works
- [ ] git commit: feat: Phase 4 dashboard & charts complete
- [ ] git tag: v0.4.0
- [ ] git push
