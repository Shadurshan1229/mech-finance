# MECH Finance — Test Strategy

## Levels

### 1. Unit tests (Vitest)
Location: `src/lib/__tests__/`
Run: `npm test`
Target: pure logic functions only — no React, no Supabase.

Functions to test:
- `computeAccountBalance()` — income/expense/transfer math
- `formatCurrency()` — LKR formatting
- `computeGoalProgress()` — percentage calculation
- `normalizeRecurringCost()` — monthly/quarterly/yearly → monthly
- `computeBudgetRemaining()` — budget minus actual
- `computeNetWorth()` — assets minus liabilities
- `computeCCOutstanding()` — CC expenses minus payments

### 2. Integration tests (Vitest + Supabase test DB)
Location: `tests/`
Run: `npm run test:run`
Target: Supabase CRUD + RLS policies.

Test per phase — only write integration tests for completed phases.

### 3. Manual smoke tests
Run after each phase before tagging.
Checklists below — tick these off yourself in the browser.

---

## Phase 1 Smoke Test

### App loads
- [ ] `npm run dev` starts with no errors
- [ ] App loads at localhost:5173 with no console errors
- [ ] No TypeScript errors: `npx tsc --noEmit` passes clean

### Styling
- [ ] Background is `#F9F2EE` (cream) — not white
- [ ] No rounded corners visible anywhere (check buttons, inputs, cards)
- [ ] Toggle/switch component is the ONLY rounded element
- [ ] No box shadows on any element
- [ ] Space Grotesk loading on headings/buttons
- [ ] Poppins loading on body text
- [ ] JetBrains Mono loading on any data values

### Auth
- [ ] Auth page renders with MECH DS styling
- [ ] Email input accepts input
- [ ] "Send magic link" button triggers Supabase email
- [ ] Magic link email arrives
- [ ] Clicking link logs in and redirects to dashboard
- [ ] Refreshing page while logged in stays logged in
- [ ] Unauthenticated user is redirected to auth page

### Shell & routing
- [ ] Topbar renders: MECH logo left, user info right
- [ ] Sidebar renders with all nav groups and items
- [ ] Active nav item shows orange left border
- [ ] All 13 routes navigate without errors
- [ ] PageHeader renders with correct title per route
- [ ] Sidebar nav group labels are uppercase

### Database
- [ ] All 15 tables visible in Supabase Table Editor:
  - [ ] accounts
  - [ ] credit_cards
  - [ ] categories
  - [ ] transactions
  - [ ] transfers
  - [ ] budgets
  - [ ] recurring_payments
  - [ ] credits_debts
  - [ ] credit_debt_payments
  - [ ] goals
  - [ ] portfolio_assets
  - [ ] portfolio_asset_snapshots
  - [ ] portfolio_liabilities
  - [ ] portfolio_liability_snapshots
  - [ ] account_balance_snapshots
- [ ] RLS enabled on all user-owned tables
- [ ] Default categories seeded after first login (check categories table)

### Docs
- [ ] .claude/CLAUDE.md exists and is readable
- [ ] docs/design/MECH_DESIGN.md exists
- [ ] docs/spec/PROJECT.md exists
- [ ] docs/spec/DATABASE.md exists
- [ ] docs/build/PHASES.md exists
- [ ] docs/build/PHASE_1.md exists
- [ ] docs/decisions/ADR.md exists with 5 entries
- [ ] docs/testing/TESTING.md exists (this file)

### Git
- [ ] .gitignore has: node_modules, .env.local, dist
- [ ] .env.example committed (no real keys)
- [ ] .env.local NOT committed
- [ ] Initial commit exists with all files

---

## Phase 2 Smoke Test
*(written before Phase 2 starts)*

## Phase 3 Smoke Test
*(written before Phase 3 starts)*
