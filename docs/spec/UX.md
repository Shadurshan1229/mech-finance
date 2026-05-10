# MECH Finance — UX Patterns

> Stub — filled in before Phase 6.

## Planned for Phase 6

### Onboarding
- First login: seed categories edge function runs automatically
- Empty states on every page with clear call-to-action
- Tooltip walkthrough for key interactions (Phase 6)

### Empty states
Each module needs an empty state component:
- Icon (Lucide, 32px, mech-ink-50)
- Title (display-sm, Space Grotesk)
- Description (body-md, Poppins, mech-ink-80)
- Primary CTA button

### Keyboard shortcuts
To be defined in Phase 6. Likely:
- `N` — new transaction (quick add)
- `?` — show keyboard shortcuts overlay
- `G D` — go to Dashboard
- `G T` — go to Transactions

### Tooltips
Use shadcn Tooltip component with MECH DS styling.
Trigger on hover for icon-only buttons and truncated values.

### CSV Export
Available on Transactions and Portfolio pages.
`date-fns` for date formatting in exports.
