# CNIB Venture Studio — Visual Upgrade Patch Set

Produced from a Claude Code session whose repo scope was locked to
`jacobcharendoff-cnib-the-missing-99`, so it could not push directly to
`Jacobcharendoff/cnib-venture-studio`. These patches contain the full 4-layer
visual upgrade (Layers 2, 3, 4 — Layer 1 was verification only, no changes).

Base commit: `3876cb2` ("Visual upgrade: animated iris hero, phase icons,
counter animation"). Apply on top of that commit on `main`.

## Files

- `0001-feat-premium-component-level-visual-upgrades.patch` — Layer 2
- `0002-feat-page-level-visual-identity-and-section-design.patch` — Layer 3
- `0003-feat-micro-interactions-texture-and-responsive-polis.patch` — Layer 4
- `combined.patch` — all three layers as a single diff (no commit history)

## Apply as three commits (preferred)

```bash
git clone https://github.com/Jacobcharendoff/cnib-venture-studio.git
cd cnib-venture-studio
git checkout -b claude/setup-cnib-venture-studio-iPF6J 3876cb2
git am /path/to/0001-*.patch /path/to/0002-*.patch /path/to/0003-*.patch
npm install
npx next build    # verify
git push -u origin claude/setup-cnib-venture-studio-iPF6J
```

## Apply as a single squashed diff

```bash
git checkout -b claude/setup-cnib-venture-studio-iPF6J 3876cb2
git apply /path/to/combined.patch
git add -A
git commit -m "feat: comprehensive visual upgrade (4 layers)"
npx next build
git push -u origin claude/setup-cnib-venture-studio-iPF6J
```

## What changed

**Layer 2 — component-level upgrades**
- `glass-card` rebuilt with gradient border (mask technique), deeper shadow + yellow glow on hover
- Buttons (`btn-primary`, `btn-secondary`, `btn-dark`) gain gradient-shift hover, `scale(1.02)` hover / `scale(0.98)` active, shimmer sweep
- New `stat-grid-dark` utility with vertical gradient dividers between stats
- `phase-num-ring` utility: radial yellow glow + soft border ring behind phase numbers, brightens on card hover
- Nav: animated yellow underline that slides between active routes via framer-motion `layoutId` spring, new mobile slide-in drawer from right with backdrop blur + staggered items
- New utility classes: `dot-grid-bg`, `dot-grid-bg-light`, `drift-dots`, `progress-bar-track`/`progress-bar-fill`, `filter-pill`, `cursor-glow`, `mobile-ring-decor`, `noise-subtle`, `quote-mark`, `phase-num-ring`, `divider-fade-down`/`divider-fade-right`, `nav-link-wrap`/`nav-link-indicator`

**Layer 3 — page-level identity**
- Home: drifting dot particle layer in hero, mobile-only decorative ring (iris rings hidden <1024px), decorative SVG quote mark behind instructor section, `cursor-glow` on hero
- Themes: `PhaseIcon` next to each phase header + a journey progress bar (n/6) showing position in the flow
- Progress: animated `progress-bar-fill` with shimmer + completion glow-pulse at 100%, vertical gradient connector between phase sections on desktop
- Toolkit: new client component `ToolkitFilter` — pill-style filter buttons with `AnimatePresence` layout animations between filter states
- About: `ParallaxSection` wrapper on story heading, timeline-style yellow dots for each paragraph, `stat-grid-dark` with dot-grid backdrop

**Layer 4 — micro-interactions, texture, polish**
- `CursorGlow` component: non-rendering client tracker that attaches `mousemove` to its `.cursor-glow` ancestor and updates `--cursor-x` / `--cursor-y` via `requestAnimationFrame`. Respects `prefers-reduced-motion` and `hover: none`.
- `PageTransition` component: `AnimatePresence` wrapping layout `children`, keyed on pathname; 350ms fade + 8px y offset (0 when reduced motion).
- `noise-subtle` SVG-noise overlay applied to dark sections; `dot-grid-bg` backdrops for depth on CTA + phases sections.

## Build verification

All three layers build cleanly (`npx next build`, Next.js 16.2.4 + Turbopack).
No TypeScript errors, no unused imports, no hydration mismatches.

## Notes

- `package-lock.json` was generated during `npm install` but intentionally **not** committed — the repo currently doesn't track one. If the team wants to start, commit it in a separate change.
- All new components using hooks/motion are `"use client"`.
- All decorative elements carry `aria-hidden="true"`.
- Yellow is only used on dark backgrounds for text (WCAG AA). Yellow-on-light uses `--cnib-yellow-on-light` (#766C00, 5.3:1 on white).
