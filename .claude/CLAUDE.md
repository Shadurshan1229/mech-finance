# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MECH Finance — Claude Standing Instructions
**Project:** MECH Finance | Personal Finance Manager
**Repo:** https://github.com/Shadurshan1229/mech-finance
**Stack:** React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + Supabase + Recharts

---

## Development commands

```bash
npm run dev          # start dev server at localhost:5173
npm run build        # tsc -b && vite build
npm run preview      # preview production build
npm test             # vitest (watch mode)
npm run test:run     # vitest (single run, CI)
npx tsc --noEmit     # type-check without emitting
```

**Environment** — copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Path alias** — `@/` resolves to `src/` (configured in `vite.config.ts`).

---

## Architecture overview

### Data flow
```
Supabase DB
  └─ src/hooks/         ← all queries & mutations live here
       └─ components/   ← call hooks, never Supabase directly
            └─ pages/   ← thin composition only, no business logic
```
Business logic (balance calc, goal progress, budget remaining, net worth) lives in `src/lib/utils.ts` pure functions — use those, don't recalculate inline.

### Auth & session
`App.tsx` initialises the Supabase auth listener, writes `user`/`sessionLoaded` to Zustand, and seeds default categories on first login. `AppLayout` blocks rendering until `sessionLoaded` is true, then redirects unauthenticated users to `/auth`.

### Layout hierarchy
```
<RouterProvider>
  /auth  →  <Auth>  (standalone)
  *      →  <AppLayout>  (guards auth, waits for session)
               └─ <Shell>
                    ├─ <Topbar>
                    ├─ <Sidebar>  (nav from NAV_GROUPS in constants.ts)
                    └─ <Outlet>   (page content)
```

### Constants vs types
- `src/types/index.ts` — TypeScript interfaces mirroring all 15 DB tables, plus join types (`TransactionWithRefs`, `BudgetWithCategory`)
- `src/lib/constants.ts` — runtime arrays and nav config (`ACCOUNT_TYPES`, `NAV_GROUPS`, etc.) — pure TS, no React/Supabase imports

### Supabase schema
15 tables — all user-owned tables have RLS (`auth.uid() = user_id`). Migration at `supabase/migrations/001_initial_schema.sql`. Apply via Supabase Dashboard SQL Editor or `supabase db push`. For schema changes: update `docs/spec/DATABASE.md` first, then write a new numbered migration file.

### Tests
- Unit tests: `src/lib/__tests__/` — pure logic functions only (no React, no Supabase), run with `npm test`
- Integration tests: `tests/` — Supabase CRUD + RLS, run with `npm run test:run`
- Manual smoke test checklist: `docs/testing/TESTING.md`

---

## Non-negotiables — read before every session

### Design
- ALL UI must follow MECH DS v1.2.0 — read `docs/design/MECH_DESIGN.md` before any UI work
- No border radius except toggle/switch. No box shadows. No dark mode. Light only.
- All numbers and data values: JetBrains Mono (`font-mono` class or `data-amount` attribute)
- All labels, headings, buttons, nav: Space Grotesk (`font-grotesk`)
- All body/description text: Poppins (`font-poppins`)
- Status labels, table headers, section labels: UPPERCASE + tracked
- Orange (`mech-orange` / `#FF5B24`) is signal only — one per view, never decorative
- Depth via borders and background contrast only — never shadows

### Code
- TypeScript strict mode — zero `any` types
- Every exported component gets a JSDoc comment describing what it does
- Supabase queries go in `src/hooks/` only — never directly in components or pages
- `src/lib/` is pure TypeScript — zero React imports, zero Supabase imports
- Pages (`src/pages/`) are thin composition layers — no business logic
- Zustand store (`src/store/`) is for UI state only — not server data
- Forms use React Hook Form + Zod schemas — no uncontrolled inputs
- All currency amounts: `NUMERIC(15,2)` in DB, formatted as `LKR 12,500.00` in UI

### Git
- Commit format: `type(scope): description`
  - Types: feat | fix | chore | docs | style | refactor | test
  - Example: `feat(transactions): add quick-add dialog`
- Never commit directly to main — use feature branches

---

## Before starting any task

1. Check current active phase in `docs/build/PHASES.md`
2. Read the relevant spec section in `docs/spec/`
3. For UI work: read `docs/design/MECH_DESIGN.md`
4. For schema changes: update `docs/spec/DATABASE.md` FIRST, then write migration
5. For architecture decisions: log in `docs/decisions/ADR.md`

---

## Current Active Phase
**Phase 1 — Foundation**
See `docs/build/PHASE_1.md` for task checklist.

---

## Key file map
| What | Where |
|---|---|
| Design system | `docs/design/MECH_DESIGN.md` |
| DB schema | `docs/spec/DATABASE.md` |
| Module features | `docs/spec/MODULES.md` |
| Build phases | `docs/build/PHASES.md` |
| Active phase tasks | `docs/build/PHASE_1.md` |
| Test strategy | `docs/testing/TESTING.md` |
| Architecture decisions | `docs/decisions/ADR.md` |
| Supabase client | `src/lib/supabase.ts` |
| Global types | `src/types/index.ts` |
| App store | `src/store/useAppStore.ts` |
