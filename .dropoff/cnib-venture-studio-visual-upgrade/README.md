# CNIB Venture Studio — Visual Upgrade Patch Set

Produced from a Claude Code session scoped to
`jacobcharendoff-cnib-the-missing-99`, so it can't push directly to
`Jacobcharendoff/cnib-venture-studio`. Four sequential patches sit on
top of base commit `3876cb2` ("Visual upgrade: animated iris hero,
phase icons, counter animation").

## Files

- `0001-feat-premium-component-level-visual-upgrades.patch` — Layer 2
- `0002-feat-page-level-visual-identity-and-section-design.patch` — Layer 3
- `0003-feat-micro-interactions-texture-and-responsive-polis.patch` — Layer 4
- `0004-fix-midnight-amber-palette-atelier-aesthetic-visibil.patch` — **palette pivot + atelier aesthetic + visibility fixes**
- `combined.patch` — all four patches as a single diff (no commit history)

## Apply as four commits (preferred)

```bash
git clone https://github.com/Jacobcharendoff/cnib-venture-studio.git
cd cnib-venture-studio
git checkout -b claude/setup-cnib-venture-studio-iPF6J 3876cb2
git am /path/to/0001-*.patch /path/to/0002-*.patch \
       /path/to/0003-*.patch /path/to/0004-*.patch
npm install
npx next build    # verify
git push -u origin claude/setup-cnib-venture-studio-iPF6J
```

## Apply as a single squashed diff

```bash
git checkout -b claude/setup-cnib-venture-studio-iPF6J 3876cb2
git apply /path/to/combined.patch
git add -A
git commit -m "feat: visual upgrade — midnight/amber atelier aesthetic"
npx next build
git push -u origin claude/setup-cnib-venture-studio-iPF6J
```

## What changed

### Layer 2 — component-level upgrades
- `glass-card` rebuilt with gradient border (mask technique), deeper
  shadow + amber glow on hover
- Buttons (`btn-primary`, `btn-secondary`, `btn-dark`) gain gradient-
  shift hover, `scale(1.02)` hover / `scale(0.98)` active, shimmer sweep
- New `stat-grid-dark` utility with vertical gradient dividers
- `phase-num-ring` utility with soft glow behind phase numbers
- Nav: animated amber underline that slides between active routes
  via framer-motion `layoutId`, mobile slide-in drawer from right

### Layer 3 — page-level identity
- Home: drifting dot particles, mobile-only decorative ring,
  decorative SVG quote mark, `cursor-glow` on hero
- Themes: `PhaseIcon` + journey progress bar (n/6)
- Progress: animated `progress-bar-fill` with shimmer + completion
  glow-pulse at 100%
- Toolkit: `ToolkitFilter` with `AnimatePresence` layout animations
- About: `ParallaxSection`, timeline dots, `stat-grid-dark` with
  dot-grid backdrop

### Layer 4 — micro-interactions & polish
- `CursorGlow` component: non-rendering client tracker, respects
  `prefers-reduced-motion` + `hover: none`
- `PageTransition` component: `AnimatePresence` keyed on pathname
- `noise-subtle` SVG-noise overlay, `dot-grid-bg` backdrops

### Layer 4.5 (commit `0004`) — palette pivot + atelier aesthetic
**This patch replaces the harsh CNIB highlighter-yellow aesthetic with
a warmer, more distinctive "midnight + amber / field-notes" design
language.**

Palette (variable names retained; values changed):
- `--cnib-yellow`: `#FFF100` → `#D4A574` (warm amber)
- `--cnib-black`:  `#0A0A0A` → `#0E1420` (midnight blue-black)
- Cream `#F5EFE5` replaces pure white on dark surfaces
- All hardcoded `rgba(255,241,0,…)` swapped for amber rgb throughout
  `globals.css` and every component (`Header`, `HeroVisual`,
  `ProgressWidget`, page files)

Visibility fixes:
- `FadeIn` / `Stagger` / `ScaleIn` / `SlideIn` hidden states now
  start at `opacity: 0.55–0.6` (was 0) so content is never fully
  invisible while waiting for the viewport observer
- `.glass-card` background opacity bumped from 0.045/0.02 to 0.09/0.05
- `--text-on-dark-muted` raised from 0.55 to 0.76

New visual language (utility classes in `globals.css`):
- `.tilt-card-a` through `.tilt-card-f` — subtle ±1.2° rotation, levels
  to 0° on hover/focus (index-card-on-a-board feel)
- `.ghost-num` — oversized faded outlined numeral that sits behind card
  content as typographic scenery
- `.constellation-node` + `star-twinkle` keyframes — glowing amber
  "star" points with pulsing light
- `.marker-ink` — semi-transparent amber highlighter band behind a
  word, with irregular border-radius (hand-drawn feel)
- `.scribble-underline`, `.scribble-circle`, `.scribble-arrow`,
  `.scribble-star` — inline SVG hand-drawn annotation accents
- `.paper-grain` — warm fractal-noise overlay (replaces the sterile
  generic noise on dark sections)
- `.pictograph` — amber-inked icon wrapper with soft glow + rotate on
  hover
- `.index-tag` — small tilted pinned-label replacement for caption
  eyebrows

Home page applications (`src/app/page.tsx`):
- Hero: `index-tag` eyebrow, `scribble-underline` on "first dollar"
- Who This Is For: tilted premium cards, oversized faded numerals
  peeking from top-right corner, `marker-ink` on "great idea"
- 6 Phases: tilt on every card, `ghost-num` per card, `pictograph`
  icon wrapper, amber star-node next to the icon, scribble
  annotations in the margins (desktop only), `marker-ink` on
  "18 modules"
- CTA: `marker-ink` on "first sale"

## Build verification

All four layers build cleanly (`npx next build`, Next.js 16.2.4 +
Turbopack). No TypeScript errors, no unused imports, no hydration
mismatches.

## Notes

- `0004` includes `package-lock.json` (generated during `npm install`).
  Previous patches intentionally omitted it; if the team wants to keep
  it out, `git reset HEAD~1 -- package-lock.json && git commit --amend`
  after applying, or exclude it when running `git apply`.
- All new client components carry `"use client"`.
- All decorative elements carry `aria-hidden="true"`.
- Amber on dark passes WCAG AA. Amber-on-light uses
  `--cnib-yellow-on-light: #6B4F2A` (7.1:1 on white).
