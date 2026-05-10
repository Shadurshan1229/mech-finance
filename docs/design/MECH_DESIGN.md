# MECH Design System
**Version:** 1.2.0 | **Updated:** 2026-05-10 | **Stack:** Next.js + Tailwind CSS
**Maintained by:** Ajai (Shadurshan S.) — The MECH Studio

> Design philosophy: Scifi precision meets old-paper warmth. Nothing OS utility meets cyberpunk signal. Every element is intentional. Orange is a signal — not decoration. Corners are sharp. Surfaces are flat. No elevation theatre.

---

## Table of Contents
1. [Brand Identity](#1-brand-identity)
2. [Color Tokens](#2-color-tokens)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Border & Radius](#5-border--radius)
6. [Iconography](#6-iconography)
7. [Motion](#7-motion)
8. [Component Patterns](#8-component-patterns)
9. [Layout System](#9-layout-system)
10. [Usage Rules](#10-usage-rules)
11. [Tailwind Config](#11-tailwind-config)

---

## 1. Brand Identity

**Studio:** The MECH Studio
**Tagline:** *Build. Ship. Iterate.*
**Tone:** Precise, minimal, operational. No filler language. No decorative noise.
**Personality:** A field engineer's toolkit — flat, sharp, readable, built to work in long sessions.

### Visual DNA
- **Light-only** — `F9F2EE` cream base with `1D1A19` ink. Not white. Not grey. Paper. No dark mode.
- **Orange as signal** — `FF5B24` appears only on active states, key metrics, CTAs, and alerts. Never used as background fill on large surfaces.
- **Monospace for data** — All numerical values, timestamps, tags, and labels use monospace. Everything else uses the defined type scale.
- **Flat & sharp** — Zero elevation. No drop shadows. No rounded corners. Borders carry all the weight.
- **Square geometry** — Buttons, inputs, cards, radio buttons, checkboxes — all `border-radius: 0`. The only exception is the toggle track and pill badge variant.
- **Uppercase for metadata** — Labels, categories, breadcrumbs, and status tags are uppercase + tracked.

---

## 2. Color Tokens

### Core Palette

| Token Name | Hex | Usage |
|---|---|---|
| `mech-orange` | `#FF5B24` | Primary signal — CTA, active states, data highlights, icons on focus |
| `mech-dark` | `#1D1A19` | Primary text, headings, dark fills |
| `mech-paper` | `#F9F2EE` | Primary background (base) — lighter cream |
| `mech-paper-secondary` | `#F1E7E2` | Secondary background, card surfaces, sidebars — warmer cream |

> **v1.2 change:** `mech-paper` and `mech-paper-secondary` values swapped. Lighter `F9F2EE` is now the base; warmer `F1E7E2` is the secondary/card surface. `mech-white` and `mech-ink-10` removed — no pure white token in the system.

### Ink Scale

| Token Name | Hex | Usage |
|---|---|---|
| `mech-ink-80` | `#3A3330` | Secondary text, captions |
| `mech-ink-50` | `#8C7D76` | Placeholder text, disabled labels |
| `mech-ink-20` | `#D4C8C2` | Borders, dividers, subtle outlines |

### Semantic / Signal

| Token Name | Hex | Usage |
|---|---|---|
| `mech-signal-green` | `#2ECC71` | Success states |
| `mech-signal-red` | `#E74C3C` | Error/destructive states |

### Legacy Aliases
> These map directly to canonical tokens. Use canonical tokens in new code — aliases exist for backward compatibility with older MECH tools.

| Alias | Maps To | Hex |
|---|---|---|
| `cream` | `mech-paper` | `#F9F2EE` |
| `charcoal` | `mech-dark` | `#1D1A19` |
| `brand.orange` | `mech-orange` | `#FF5B24` |

### CSS Variables

```css
:root {
  /* Core */
  --mech-orange:           #FF5B24;
  --mech-dark:             #1D1A19;
  --mech-paper:            #F9F2EE;   /* lighter cream — base bg */
  --mech-paper-secondary:  #F1E7E2;   /* warmer cream — cards, sidebars */

  /* Ink scale */
  --mech-ink-80:           #3A3330;
  --mech-ink-50:           #8C7D76;
  --mech-ink-20:           #D4C8C2;

  /* Semantic */
  --mech-signal-green:     #2ECC71;
  --mech-signal-red:       #E74C3C;

  /* Semantic aliases */
  --bg-base:               var(--mech-paper);
  --bg-secondary:          var(--mech-paper-secondary);
  --text-primary:          var(--mech-dark);
  --text-secondary:        var(--mech-ink-80);
  --text-muted:            var(--mech-ink-50);
  --border-default:        var(--mech-ink-20);
  --border-strong:         var(--mech-ink-80);
  --border-signal:         var(--mech-orange);
}
```

> **No dark mode tokens.** MECH tools are light-only. No `mech-white`, `mech-orange-light`, `mech-orange-dim`, `mech-ink-10`, or `mech-warning` — these are removed in v1.2.

---

## 3. Typography

### Font Families

| Role | Font | Source |
|---|---|---|
| **All UI — Headings, Labels, Buttons, Nav** | Space Grotesk | Google Fonts |
| **Body / Paragraphs / Descriptions** | Poppins | Google Fonts |
| **Document Headings** | Termina Test | Custom/Licensed |
| **Monospace / Data / Labels** | JetBrains Mono | Google Fonts |

> **Buttons use Space Grotesk** — not Poppins. All interactive elements (buttons, nav items, tabs, form labels) use Space Grotesk.

### Type Scale

| Token | Size | Line Height | Weight | Font | Usage |
|---|---|---|---|---|---|
| `display-2xl` | 48px / 3rem | 1.1 | 700 | Space Grotesk | Hero titles, cover pages |
| `display-xl` | 36px / 2.25rem | 1.15 | 700 | Space Grotesk | Page headings |
| `display-lg` | 28px / 1.75rem | 1.2 | 600 | Space Grotesk | Section titles |
| `display-md` | 22px / 1.375rem | 1.3 | 600 | Space Grotesk | Card titles, panel headers |
| `display-sm` | 18px / 1.125rem | 1.35 | 600 | Space Grotesk | Subsection headings |
| `body-lg` | 16px / 1rem | 1.6 | 400 | Poppins | Primary body text |
| `body-md` | 14px / 0.875rem | 1.6 | 400 | Poppins | Secondary body, descriptions |
| `body-sm` | 12px / 0.75rem | 1.5 | 400 | Poppins | Captions, help text |
| `label-lg` | 13px / 0.8125rem | 1.4 | 500 | Space Grotesk | Form labels, nav items, buttons |
| `label-sm` | 11px / 0.6875rem | 1.3 | 500 | Space Grotesk | Tags, badges |
| `mono-lg` | 15px / 0.9375rem | 1.5 | 400 | JetBrains Mono | Data values, metrics |
| `mono-md` | 13px / 0.8125rem | 1.4 | 400 | JetBrains Mono | Timestamps, IDs, status |
| `mono-sm` | 11px / 0.6875rem | 1.3 | 400 | JetBrains Mono | Breadcrumb paths, meta |
| `doc-heading` | 32px / 2rem | 1.15 | 700 | Termina Test | Formal document headings |
| `doc-subheading` | 20px / 1.25rem | 1.25 | 600 | Termina Test | Document section titles |

### Tracking (Letter Spacing)

| Context | Value |
|---|---|
| Monospace labels / uppercase tags | `0.08em` |
| Uppercase breadcrumbs / metadata | `0.12em` |
| Display headings | `-0.01em` |
| Button labels | `0.01em` |
| Body text | `0` |

### Typography Rules
- **Space Grotesk for all interactive elements** — buttons, tabs, nav, labels, form labels
- **Poppins for reading content** — body copy, descriptions, help text only
- **Never** mix Space Grotesk and Termina Test in the same UI context. Termina = documents only.
- **Monospace numbers only** — any numeral shown as data must use JetBrains Mono
- **Font size minimum:** 11px

---

## 4. Spacing & Layout

### Base Unit
`4px` — all spacing is a multiple of 4.

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon internal padding, tight nudges |
| `space-2` | 8px | Inline element gaps, dense rows |
| `space-3` | 12px | List item padding, small card inner |
| `space-4` | 16px | Default padding unit, form gaps |
| `space-5` | 20px | Component internal padding |
| `space-6` | 24px | Section gaps, card padding |
| `space-8` | 32px | Major section spacing |
| `space-10` | 40px | Page section breathing room |
| `space-12` | 48px | Large block separators |
| `space-16` | 64px | Page-level padding |
| `space-20` | 80px | Hero/cover whitespace |

### Grid

| Context | Columns | Gutter | Margin |
|---|---|---|---|
| Full page (desktop) | 12 | 24px | 48px |
| Tool panel | 6 | 16px | 24px |
| Mobile | 4 | 16px | 16px |
| Document layout | 8 | 24px | 64px |

### Container Widths

| Token | Width | Usage |
|---|---|---|
| `container-sm` | 640px | Narrow forms, dialogs |
| `container-md` | 960px | Default tool layout |
| `container-lg` | 1280px | Full dashboard |
| `container-xl` | 1440px | Wide workspace |

---

## 5. Border & Radius

### Border Widths

| Token | Value | Usage |
|---|---|---|
| `border-thin` | 1px | Default UI borders, dividers |
| `border-base` | 1.5px | Active inputs |
| `border-heavy` | 2px | Focused inputs, active/selected states |
| `border-signal` | 2px + `mech-orange` | Active/selected signal |

### Border Styles
- **Default:** `1px solid mech-ink-20`
- **Dashed dividers:** `1px dashed mech-ink-20` — section separators (Nothing OS reference)
- **Active/signal:** `2px solid mech-orange`
- **Strong:** `1px solid mech-ink-80` — table headers, topbar bottom

### Border Radius — SHARP GEOMETRY SYSTEM

> **Default is zero radius.** Square corners everywhere.

| Token | Value | Where Used |
|---|---|---|
| `radius-none` | `0px` | **Default** — all buttons, inputs, cards, modals, panels, tables, badges |
| `radius-sm` | `2px` | Toggle thumb only |
| `radius-full` | `9999px` | Toggle track only |

### Shadows — FLAT SYSTEM

> No drop shadows. Depth is expressed through borders and background contrast.

```css
--shadow-none:    none;   /* Default for everything */
--shadow-signal:  0 0 0 2px rgba(255, 91, 36, 0.30);  /* Focus ring only */
```

**Rules:**
- Cards: defined by border only
- Buttons: defined by border weight and fill
- Modals: full-screen backdrop overlay, no shadow
- Hover: border color or background change — never shadow

---

## 6. Iconography

**Library:** Lucide Icons (primary) + custom MECH glyphs
**Size scale:** 16px (dense UI), 20px (default), 24px (primary actions), 32px (feature icons)
**Stroke width:** 1.5px — do not use 2px

### Usage Rules
- Default color: `mech-dark` or `mech-ink-80`
- Active/hover: transition to `mech-orange`
- Outline only — never fill
- Icon + label gap: `8px` always
- Standalone icon buttons must have `aria-label`

---

## 7. Motion

### Principles
- Motion is **functional** — communicates state change, not personality
- Short durations. No bounce, no spring — flat UI gets flat easing.

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `duration-instant` | 80ms | Hover color/border changes |
| `duration-fast` | 150ms | Button press, toggle |
| `duration-base` | 200ms | Panel open, drawer |
| `duration-slow` | 300ms | Modal enter, page transition |
| `duration-crawl` | 500ms | Data load reveal, skeleton fade |

### Easing

```css
--ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-in:         cubic-bezier(0.4, 0, 1, 1);
--ease-out:        cubic-bezier(0, 0, 0.2, 1);
--ease-sharp:      cubic-bezier(0.4, 0, 0.6, 1);
```

> No `ease-spring`. Flat design uses flat easing.

### Motion Rules
- **Button press:** Background darken 8%, no scale, `80ms`
- **Card hover:** Border to `mech-ink-80`, bg to `mech-ink-10`
- **Input focus:** Border to `mech-orange` 2px, `80ms`
- **Page entrance:** Fade in only (`opacity 0 → 1`), `200ms ease-out`
- **Reduced motion:** All transitions become instant

---

## 8. Component Patterns

### 8.1 Button

**Variants:** Primary | Signal (CTA) | Secondary | Ghost | Link | Destructive

> All buttons: `border-radius: 0` | Font: **Space Grotesk** | No shadows

```tsx
// Primary — Dark fill, square
<button className="
  inline-flex items-center gap-2 px-4 py-2.5
  bg-mech-dark text-mech-paper
  font-grotesk font-medium text-sm tracking-[0.01em]
  border-2 border-mech-dark rounded-none
  transition-colors duration-fast
  hover:bg-mech-ink-80 hover:border-mech-ink-80
  active:opacity-80
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mech-orange
">
  Label
</button>

// Signal CTA — Orange fill
<button className="
  inline-flex items-center gap-2 px-4 py-2.5
  bg-mech-orange text-white
  font-grotesk font-medium text-sm tracking-[0.01em]
  border-2 border-mech-orange rounded-none
  transition-colors duration-fast
  hover:opacity-90
  active:opacity-80
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mech-orange
">
  Signal Action
</button>

// Secondary — Outlined
<button className="
  inline-flex items-center gap-2 px-4 py-2.5
  bg-transparent text-mech-dark
  font-grotesk font-medium text-sm tracking-[0.01em]
  border border-mech-ink-20 rounded-none
  transition-colors duration-fast
  hover:border-mech-dark
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mech-orange
">
  Secondary
</button>

// Ghost — No border, no fill
<button className="
  inline-flex items-center gap-2 px-3 py-2
  bg-transparent text-mech-ink-80
  font-grotesk text-sm border-none rounded-none
  transition-colors duration-instant
  hover:text-mech-dark
">
  Ghost
</button>

// Destructive — Outlined red
<button className="
  inline-flex items-center gap-2 px-4 py-2.5
  bg-transparent text-mech-signal-red
  font-grotesk font-medium text-sm
  border border-mech-signal-red rounded-none
  transition-colors duration-fast
  hover:bg-mech-signal-red hover:text-white
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mech-signal-red
">
  Delete
</button>
```

**Rules:**
- Minimum touch target height: `40px`
- Sentence case labels — never ALL CAPS
- Loading state: replace label with "Working..." — keep visual weight

---

### 8.2 Input / Form Field

> `border-radius: 0` | Labels: Space Grotesk uppercase

```tsx
<div className="flex flex-col gap-1.5">
  <label className="font-grotesk font-medium text-xs uppercase tracking-[0.08em] text-mech-ink-80">
    Field Label
  </label>
  <input
    type="text"
    className="
      w-full px-3 py-2.5
      bg-mech-paper text-mech-dark font-poppins text-sm
      border border-mech-ink-20 rounded-none
      placeholder:text-mech-ink-50
      transition-colors duration-instant
      focus:outline-none focus:border-2 focus:border-mech-orange
    "
    placeholder="Placeholder"
  />
  <span className="font-poppins text-xs text-mech-ink-50">Helper text</span>
</div>
```

---

### 8.3 Card

> `border-radius: 0` | No shadows | Depth via border + bg contrast

```tsx
// Standard
<div className="bg-mech-paper border border-mech-ink-20 rounded-none p-5 transition-colors duration-instant hover:border-mech-ink-80">
  {/* content */}
</div>

// Metric / data card
<div className="bg-mech-paper-secondary border border-mech-ink-20 rounded-none p-5">
  <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50 block mb-2">METRIC</span>
  <span className="font-mono text-3xl font-bold text-mech-dark block">00.0</span>
</div>

// Panel with header bar
<div className="border border-mech-ink-20 rounded-none">
  <div className="px-5 py-3 border-b border-mech-ink-20 bg-mech-paper-secondary">
    <span className="font-grotesk font-semibold text-xs uppercase tracking-[0.08em] text-mech-dark">PANEL TITLE</span>
  </div>
  <div className="p-5">{/* content */}</div>
</div>
```

---

### 8.4 Badge / Tag

```tsx
// Default square
<span className="inline-flex items-center px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] border border-mech-ink-20 rounded-none text-mech-ink-80">
  STATUS
</span>

// Signal / active
<span className="inline-flex items-center px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] border border-mech-orange rounded-none text-mech-orange bg-[rgba(255,91,36,0.08)]">
  ACTIVE
</span>
```

---

### 8.5 Progress Bar (Nothing OS Reference)

```tsx
<div className="flex gap-px h-1.5">
  {Array.from({ length: 60 }).map((_, i) => (
    <div key={i} style={{ flex: 1, borderRadius: 0, background: i < 38 ? '#FF5B24' : '#D4C8C2' }} />
  ))}
</div>
```

---

### 8.6 Navigation (Sidebar)

```tsx
// Active nav item
<a className="flex items-center gap-2.5 px-4 py-2 font-grotesk text-sm font-medium text-mech-dark border-l-2 border-mech-orange bg-mech-paper transition-colors duration-instant">
  <span className="w-1.5 h-1.5 rounded-full bg-mech-orange flex-shrink-0" />
  Active Item
</a>

// Default nav item
<a className="flex items-center gap-2.5 px-4 py-2 font-grotesk text-sm text-mech-ink-80 border-l-2 border-transparent transition-colors duration-instant hover:text-mech-dark">
  <span className="w-1.5 h-1.5 rounded-full bg-mech-ink-20 flex-shrink-0" />
  Nav Item
</a>
```

---

### 8.7 Table

```tsx
<table className="w-full border-collapse border border-mech-ink-20">
  <thead>
    <tr className="border-b-2 border-mech-dark bg-mech-paper-secondary">
      <th className="py-2.5 px-4 text-left font-grotesk font-semibold text-xs uppercase tracking-[0.08em] text-mech-dark">
        Column
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-mech-ink-20 transition-colors duration-instant hover:bg-mech-paper-secondary">
      <td className="py-3 px-4 font-poppins text-sm text-mech-ink-80">Value</td>
    </tr>
  </tbody>
</table>
```

---

### 8.8 Divider

```tsx
{/* Dashed — section separator */}
<hr className="border-0 border-t border-dashed border-mech-ink-20 my-6" />
```

---

## 9. Layout System

### Page Shell

```
┌──────────────────────────────────────────────────────────┐
│  TOPBAR (48px)  │ 1px solid border-b mech-ink-20         │
├────────────────┬─────────────────────────────────────────┤
│                │                                         │
│  SIDEBAR       │  MAIN CONTENT AREA                      │
│  (240px)       │  max-w: container-lg                    │
│  1px border-r  │  padding: 32px                          │
│                │                                         │
└────────────────┴─────────────────────────────────────────┘
```

- **Topbar:** `48px` height | `mech-paper` bg | `1px solid mech-ink-20` bottom
- **Sidebar:** `240px` | `mech-paper-secondary` | `1px solid mech-ink-20` right | collapsible to `48px`
- **Content:** max `container-lg` (1280px) | `32px` padding | `40px` between sections
- **All borders: `border-radius: 0` throughout shell**

---

## 10. Usage Rules

### The Sharp Geometry Rule
> **Default is zero border-radius.** Square unless there's a functional reason to round.

✅ `radius: 0`: buttons, inputs, cards, modals, panels, badges, tables, radio, checkboxes, dropdowns
✅ Exception: toggle track (`radius-full`) for interaction affordance
❌ Never round "to feel friendly" or "more modern"

### The Flat Surface Rule
> **No elevation shadows.** Depth through borders and background contrast only.

### The Orange Rule
> One signal. Precise. Never decorative.

✅ On: active borders, one CTA per view, progress fill, active nav indicator, data highlights
❌ Never: large fills, decoration, text on white

### The Monospace Rule
> Every number that represents data = JetBrains Mono.

### The Uppercase Rule
✅ Uppercase: tags, status labels, section headers, breadcrumbs, table columns, form labels
❌ Not uppercase: page titles, card titles, body text, button labels

---

## 11. Tailwind Config

See `tailwind.config.js` in the project root — this is the canonical implementation.

---

*MECH Design System — The MECH Studio — v1.2.0*
