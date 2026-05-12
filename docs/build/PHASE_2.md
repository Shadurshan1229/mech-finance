# Phase 2 — Core Data Entry
**Status:** ✅ Done
**Tag:** v0.2.0

## Tasks

### Step 1 — TanStack Query
- [x] Install @tanstack/react-query @tanstack/react-query-devtools
- [x] Set up QueryClient with staleTime/gcTime in main.tsx
- [x] Wrap app in QueryClientProvider
- [x] ReactQueryDevtools in dev only

### Step 2 — Shared components
- [x] AmountDisplay.tsx
- [x] StatusBadge.tsx
- [x] EmptyState.tsx
- [x] PageHeader.tsx (updated: description + breadcrumb string array)
- [x] FieldTooltip.tsx
- [x] ConfirmDialog.tsx

### Step 3 — Utils + tests
- [x] Add getMonthRange() to utils.ts
- [x] Add getMonthLabel() to utils.ts
- [x] normalizeToMonthly() (alias to normalizeRecurringCost)
- [x] src/lib/__tests__/utils.test.ts — 27 tests, all passing
- [x] npm run test:run passes clean

### Step 4 — Accounts
- [x] src/hooks/useAccounts.ts — CRUD + computed balance
- [x] src/pages/Accounts.tsx — cards grid, add/edit dialog, archive/restore
- [x] Empty state renders when no accounts
- [x] Total balance summary strip
- [x] Archive toggle (show/hide inactive + restore)

### Step 5 — Categories (Settings)
- [x] src/hooks/useCategories.ts — CRUD
- [x] src/pages/Settings.tsx — categories section, expense + income columns
- [x] Inline add/edit form (not dialog)
- [x] Delete blocked for default categories
- [x] Delete blocked for categories with transactions (shows count)

### Step 6 — Quick Add Dialog
- [x] src/components/forms/QuickAddDialog.tsx
- [x] Topbar "+ Add Transaction" button triggers dialog
- [x] useQuickAddShortcut hook — N key (with input guard)
- [x] Type toggle (Income / Expense)
- [x] Category combobox filtered by type
- [x] Account + Card combobox grouped
- [x] Session storage for last used category/account
- [x] Validation + submit + toast + cache invalidation

### Step 7 — Transactions
- [x] src/hooks/useTransactions.ts — filters + pagination + summary query
- [x] src/pages/Transactions.tsx — table, month navigator, filter bar, summary strip
- [x] Edit sheet (shadcn Sheet, slides from right)
- [x] Delete with ConfirmDialog
- [x] Load more (50 per page)
- [x] Empty state per month

### Step 8 — Credit Cards
- [x] src/hooks/useCreditCards.ts — CRUD + computed outstanding/available/utilization
- [x] src/pages/CreditCards.tsx — card grid, add/edit dialog, archive
- [x] Utilization bar (segmented, orange → red if >80%)
- [x] Due soon badge (within 7 days → signal, within 3 days → error)

### Step 9 — Docs
- [x] docs/build/PHASES.md — Phase 2 status = ✅ Done
- [x] docs/decisions/ADR.md — ADR-006 TanStack Query added

### Smoke test
- [ ] tsc --noEmit passes clean — ✅ zero errors
- [ ] npm run test:run passes — ✅ 27/27
- [ ] Full Phase 2 smoke test checklist passed (manual)
- [ ] git commit: feat: Phase 2 core data entry complete
- [ ] git tag: v0.2.0
- [ ] git push
