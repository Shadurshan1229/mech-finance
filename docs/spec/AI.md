# MECH Finance — AI Features

> Stub — filled in before Phase 6.

## Overview
Claude API (claude-sonnet-4-6) via Supabase Edge Functions.
API key stored server-side only — never exposed to client.

## Planned features (Phase 6)

1. **Auto-categorize** — classify a transaction description into a category
2. **Spending insights** — monthly summary of patterns and anomalies
3. **Budget coaching** — flag overspends, suggest adjustments
4. **Recurring detector** — identify likely recurring charges from history
5. **Natural language add** — parse "Lunch at McDonald's 850" into a transaction

## Architecture
- Each feature = one Supabase Edge Function
- Client sends data → function calls Claude → returns structured JSON → client renders
- All prompts stored in edge function source (not DB)
- No streaming in v1 — full response only
