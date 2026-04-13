# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Bazodiac landing page — a scroll-driven, GSAP-animated single-page app that fuses Western astrology, Chinese BaZi, and Vedic Jyotish into a unified character/partnership reading. Built with React 19 + TypeScript + Vite 7 + Tailwind CSS v3.

## Commands

```bash
npm run dev       # Start Vite dev server (HMR)
npm run build     # TypeScript check + production build (tsc -b && vite build)
npm run lint      # ESLint (flat config, TS + React hooks + React Refresh)
npm run preview   # Serve production build locally
```

No test runner is configured.

## Architecture

**Single-page scroll app** — no router. `App.tsx` orchestrates 7 sections in order, manages two pieces of state (`selectedPath` and `astrologyResult`), and wires up GSAP ScrollTrigger snap logic across pinned sections.

### Section Flow

1. **HeroSection** — entrance animation, CTA scrolls to paths
2. **TwoPathsSection** — user picks "character" or "partnership"
3. **InputSection** — birth date/time form (+ partner fields for partnership path), pinned with scrub
4. **RevealSection** — shows `AstrologyResult` (zodiac + BaZi + Nakshatra fusion)
5. **HowItWorksSection** — explainer (flowing, not pinned)
6. **SampleReadingsSection** — example outputs (flowing)
7. **ClosingSection** — CTA, restart handler

Sections that use `pin: true` in their ScrollTrigger config get snapped to via the global snap logic in `App.tsx`.

### Animation Pattern

Every section follows the same pattern: `useLayoutEffect` → `gsap.context()` → timeline with `scrollTrigger: { trigger, pin, scrub }` → cleanup via `ctx.revert()`. GSAP + ScrollTrigger is registered globally in `App.tsx`.

### Styling

- **shadcn/ui (new-york style)** — 50+ Radix-based components in `src/components/ui/`, configured via `components.json`. Import as `@/components/ui/<name>`.
- **Tailwind with CSS variables** — design tokens in `src/index.css` (`:root` and `.dark` themes). Custom palette: `--parchment`, `--midnight`, `--gold`, `--ink`, `--warm-gray`, `--cream`.
- **Typography** — headings use Cormorant Garamond (serif), body uses Inter (sans-serif), monospace uses IBM Plex Mono. Set in `index.css` `@layer base`.
- **Path alias** — `@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### Key Utilities

- `src/utils/astrology.ts` — all calculation logic: Western zodiac, BaZi (Heavenly Stems + Earthly Branches), Nakshatra, element fusion. Pure functions, no side effects.
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `src/hooks/use-mobile.ts` — responsive breakpoint hook.
- `src/components/SunIcon.tsx` — custom SVG components (SunIcon, SunRing, CornerBrackets) used across sections.

## Conventions

- Sections live in `src/sections/`, shared components in `src/components/`.
- All section components are named exports (not default).
- Navigation is handled via `document.getElementById().scrollIntoView()` — no hash routing.
- Dark mode support exists in CSS variables but is not currently toggled in the UI.
