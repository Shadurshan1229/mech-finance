# MECH Finance — Project Overview
**Version:** 1.0.0 | **Started:** 2026-05-10
**Owner:** Ajai (Shadurshan S.) — The MECH Studio

## What it is
A web-first personal finance manager. Desktop-width, full-picture sessions.
Not a mobile app. Not multi-user. Built for one person who wants to see
everything at once without touching Notion.

## What it is NOT
- Not a bank integration tool (manual entry only, v1)
- Not multi-currency (LKR only, v1)
- Not multi-user
- Not a mobile app (web only, responsive is nice-to-have not required)

## Stack rationale
| Choice | Reason |
|---|---|
| Vite over Next.js | SPA behind auth — no SSR/SEO needed. Simpler. Faster DX. |
| Supabase | Already familiar from MECH Quote Generator. Auth + DB + Storage + Edge Functions in one. |
| shadcn/ui | Accessible components, fully overridable via CSS vars. Matches MECH DS override pattern. |
| Recharts | Best React-native charting. Composable, TypeScript-first. |
| Zustand | Lightweight UI state. No Redux overhead for a personal tool. |
| React Hook Form + Zod | Schema-first validation. Forms are the core interaction. |

## Core modules
1. Dashboard — full picture overview
2. Transactions — unified income + expense log
3. Budgets — monthly limits vs actual
4. Accounts — cash, bank, e-wallet
5. Credit Cards — limits, billing, payment tracking
6. Credits & Debts — informal money owed to/from people
7. Goals — savings targets funded by transfers
8. Recurring — subscriptions and fixed payments
9. Portfolio — tracked assets, liabilities, net worth over time

## Design system
MECH DS v1.2.0 — see `docs/design/MECH_DESIGN.md`
Enforced via: Tailwind config, globals.css shadcn overrides, CLAUDE.md rules.

## Currency
LKR (Sri Lankan Rupee). Format: `LKR 12,500.00`
All amounts stored as `NUMERIC(15,2)`. No multi-currency in v1.

## AI
Claude API (claude-sonnet-4-6) via Supabase Edge Functions.
API key never exposed to client. 5 AI features — see `docs/spec/AI.md`.
