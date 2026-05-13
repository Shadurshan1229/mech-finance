# Phase 3 — Financial Logic
**Status:** ✅ Done
**Tag:** v0.3.0

## Tasks

### Step 1 — Switch component
- [x] src/components/ui/switch.tsx — @base-ui/react/switch, rounded track, MECH DS colors

### Step 2 — Budgets
- [x] src/hooks/useBudgets.ts — upsert (UNIQUE constraint), actual spend per category, copy from last month
- [x] src/pages/Budgets.tsx — month navigator, summary strip, Nothing OS segment bars, Set Budgets sheet with rollover toggle

### Step 3 — Credits & Debts
- [x] src/hooks/useCreditsDebts.ts — createRecord, logPayment (updates remaining + status), settleRecord, deleteRecord
- [x] src/pages/CreditsDebts.tsx — I Owe / They Owe / Settled tabs, summary strip, payment progress bar, log payment dialog

### Step 4 — Transfers
- [x] src/hooks/useTransfers.ts — four mutations (withdrawCash, transferBetweenAccounts, payCard, fundGoal), all invalidate accounts/cards/goals/transactions
- [x] src/components/forms/WithdrawCashDialog.tsx — bank/ewallet → cash account
- [x] src/components/forms/TransferDialog.tsx — account → account
- [x] src/components/forms/PayCardDialog.tsx — account → credit card
- [x] src/components/forms/FundGoalDialog.tsx — account → goal

### Step 5 — Accounts + CreditCards contextual buttons
- [x] Accounts: Withdraw Cash button (non-cash accounts), Transfer button (all accounts)
- [x] CreditCards: Pay Card button on each card

### Step 6 — Goals
- [x] src/hooks/useGoals.ts — CRUD + live current/progress from transfers
- [x] src/pages/Goals.tsx — goal cards with Nothing OS segment bars, Fund Goal dialog, Complete, show/hide completed

### Step 7 — Docs
- [x] docs/build/PHASES.md — Phase 3 status = ✅ Done
- [x] docs/decisions/ADR.md — ADR-007 contextual transfers
- [x] docs/build/PHASE_3.md — this file

### Smoke test
- [x] tsc --noEmit passes clean — zero errors
- [x] Full Phase 3 smoke test (manual) — confirmed by user, Supabase verified
- [x] git commit: feat: Phase 3 financial logic complete — commit a778090
- [x] git tag: v0.3.0
- [x] git push — pushed to origin/main
