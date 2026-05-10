# Architecture Decision Record
**Project:** MECH Finance

Format: ## ADR-XXX — Title | Date | Status

---

## ADR-001 — Vite over Next.js | 2026-05-10 | Accepted
**Context:** Choosing build tool for a personal finance web app behind auth.
**Decision:** Vite + React SPA.
**Reason:** App is behind auth — no SEO needed. Vite is faster in dev, simpler to deploy, zero SSR complexity. Next.js adds overhead with no benefit for this use case.

## ADR-002 — shadcn/ui with MECH DS overrides | 2026-05-10 | Accepted
**Context:** Choosing component library compatible with MECH DS v1.2.0.
**Decision:** shadcn/ui with CSS variable override in globals.css + `border-radius: 0 !important` nuclear option.
**Reason:** shadcn is fully unstyled via CSS vars, accessible by default, has all the components needed (Table, Dialog, Tooltip, Combobox, Sheet, Progress). Override effort ~1 session vs building from scratch.

## ADR-003 — Supabase for backend | 2026-05-10 | Accepted
**Context:** Choosing backend for auth, DB, storage, and AI edge functions.
**Decision:** Supabase (existing familiarity from MECH Quote Generator).
**Reason:** Auth + PostgreSQL + Storage + Edge Functions in one. No separate backend to maintain. RLS handles per-user data isolation. Already have project credentials.

## ADR-004 — No multi-currency in v1 | 2026-05-10 | Accepted
**Context:** Should v1 support multiple currencies?
**Decision:** LKR only in v1. Schema uses TEXT currency column for future extension.
**Reason:** Adds significant complexity (exchange rate fetching, conversion logic, display formatting). Not needed for personal use case. Currency column is in schema — adding support later requires a migration + UI work only.

## ADR-005 — Computed balances not stored | 2026-05-10 | Accepted
**Context:** Should account balances be stored as a column or computed on the fly?
**Decision:** Computed in hooks from raw transaction data. Only snapshots stored for history charts.
**Reason:** Storing a balance column creates sync bugs whenever transactions are edited/deleted. Computed balance from source data is always accurate. Snapshots give historical data without the sync problem.
