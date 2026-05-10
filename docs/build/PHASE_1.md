# Phase 1 — Foundation
**Status:** 🔄 In Progress
**Target tag:** v0.1.0

## Tasks

### Setup
- [x] Vite + React 19 + TypeScript scaffold
- [x] Install all dependencies (see PROJECT.md stack)
- [x] Configure Tailwind CSS v4 with MECH DS tailwind.config.js
- [ ] Install shadcn/ui
- [x] Apply MECH DS overrides to globals.css
- [x] Configure .env.local with Supabase credentials
- [x] Set up .gitignore (node_modules, .env.local, dist)

### Documentation
- [x] Write .claude/CLAUDE.md
- [x] Write docs/spec/PROJECT.md
- [x] Write docs/spec/DATABASE.md
- [x] Write docs/spec/MODULES.md (stub)
- [x] Write docs/spec/AI.md (stub)
- [x] Write docs/spec/UX.md (stub)
- [x] Write docs/build/PHASES.md
- [x] Write docs/build/PHASE_1.md (this file)
- [x] Write docs/build/DONE.md (empty)
- [x] Write docs/decisions/ADR.md with first 5 entries
- [x] Write docs/testing/TESTING.md with Phase 1 smoke test
- [x] Copy MECH_DESIGN.md to docs/design/

### Auth
- [x] Build Auth page (magic link — MECH DS styled)
- [x] Set up Supabase client at src/lib/supabase.ts
- [x] Auth session handling in App.tsx (protected routes)
- [ ] Test magic link sends and logs in correctly

### Shell & Routing
- [x] Set up React Router v7 in router.tsx
- [x] All 13 routes registered with placeholder pages
- [x] Build Shell.tsx (Topbar + Sidebar + content wrapper)
- [x] Build Topbar.tsx — logo + nav actions
- [x] Build Sidebar.tsx — full nav groups, active state, MECH DS styled
- [x] Build PageHeader.tsx — reusable page title + breadcrumb

### Database
- [x] Write supabase/migrations/001_initial_schema.sql (all 15 tables + RLS)
- [ ] Run migration against Supabase project
- [ ] Verify all 15 tables exist in Supabase dashboard
- [x] Write seed-categories Edge Function
- [ ] Test: default categories seeded on first login

### Types
- [x] Write src/types/index.ts — TypeScript interfaces for all 15 tables

### Smoke Test
- [ ] Run full Phase 1 smoke test (see docs/testing/TESTING.md)
- [ ] Fix any failures
- [ ] Run tsc --noEmit — zero errors
- [ ] Git commit: chore: Phase 1 foundation complete
- [ ] Git tag: v0.1.0
