# iris. — AI Member Engagement Tool for CNIB

## Claude Code Working Rules

### Always work in small batches
- **One logical unit per commit** — one file, or one section of a file. Never attempt to write or rewrite an entire large file in a single tool call.
- **CSS first, then HTML** — when rebuilding a page, commit the stylesheet before touching markup.
- **HTML in sections** — add 1–2 sections per batch, commit and push after each, then continue.
- **JS last** — add JavaScript only after all HTML and CSS are committed and stable.
- **Max ~150 lines per Write or Edit call** — if a block of content exceeds this, split it.
- **Commit after every batch** — never accumulate more than one logical unit of uncommitted work.
- **Push after every commit** — keep the remote up to date so Vercel deploys incrementally.
- This prevents context window stalls, timeouts, and lost work.



## What This Is
iris. is an agentic AI navigator for Canadians living with sight loss. Built for CNIB (Canadian National Institute for the Blind). She matches members to programs, services, and community based on their diagnosis, geography, life stage, and emotional state. Think Siri for sight loss — but with empathy, clinical accuracy, and deep knowledge of the CNIB ecosystem.

**Live demo:** https://meet-iris-app.vercel.app/
**Repo:** Jacobcharendoff/jacobcharendoff-cnib-the-missing-99

## Current State (April 2026)
The entire app is a single `index.html` file (~400KB, 9,565 lines). It works as a demo but is not production-ready. This file contains ALL HTML, CSS, and JavaScript inline.

### What Works
- 3 interactive demo personas (Margaret 68/AMD, David 42/RP, Priya 34/diabetic retinopathy)
- Voice input via Web Speech API (STT)
- Voice output via ElevenLabs TTS (proxied through `/api/tts` serverless function)
- LLM conversations via Anthropic Claude API (proxied through `/api/chat`)
- Mobile Safari voice fix using persistent Audio element pattern
- Basic WCAG 2.1 AA accessibility (ARIA roles, keyboard nav, focus indicators)
- Responsive design (mobile-first, black/yellow CNIB brand)

### What's Broken / Missing
- **No backend** — no session persistence, no member profiles, no conversation history
- **Single-file architecture** — impossible to maintain, test, or extend
- **No real authentication** — demo mode only
- **No program matching engine** — demos use hardcoded persona scripts with LLM improvisation
- **No admin dashboard** — CNIB staff can't see conversations or outcomes
- **No analytics** — no way to measure engagement, program referrals, or satisfaction
- **API keys in serverless functions** — fine for demo, not for production

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (needs migration to React/Next.js or similar)
- **Hosting:** Vercel (auto-deploys from GitHub main branch)
- **TTS:** ElevenLabs API via `/api/tts` Vercel serverless function
- **LLM:** Anthropic Claude API via `/api/chat` Vercel serverless function
- **STT:** Browser Web Speech API (SpeechRecognition)

## Engineering Priorities (in order)
1. **Split the monolith** — Extract into proper component architecture
2. **Build conversation engine** — Real matching logic, not hardcoded scripts
3. **Add session backend** — Persist conversations, build member profiles over time
4. **Voice service** — Robust TTS/STT with proper queue management, interruption handling
5. **Admin dashboard** — CNIB staff visibility into conversations and outcomes
6. **Accessibility audit** — Full WCAG 2.1 AA compliance, screen reader testing
7. **Channel partner mode** — Embeddable widget for ophthalmologists, hospitals, etc.

## Critical Technical Decisions Already Made

### Persistent Audio Element (DO NOT REGRESS)
Mobile Safari blocks `new Audio()` objects created after async operations (fetch, LLM calls). The fix is a single persistent Audio element created at page load, unlocked on first user gesture, and reused for ALL TTS playback by swapping `.src`. Search for `persistentAudio` in index.html to see the pattern. Every TTS path MUST use this element — never create new Audio objects.

### Accessibility Baseline
- Modal has `role="dialog"` + `aria-modal="true"` + `aria-label`
- All interactive elements have `aria-label`
- `:focus-visible` outlines use CNIB yellow (#FFD100)
- `.sr-only` and `.sr-only-focusable` CSS utilities exist
- Demo cards have `role="button"` + `tabindex="0"` + keyboard Enter/Space handlers

## Brand Rules (Non-Negotiable)
- **Colors:** Primary black #0A0A0A, CNIB Yellow #FFD100, White #FAFAFA
- **Voice:** Plain, warm, real. No jargon. No pity. No inspiration porn.
- **Name:** Always lowercase "iris." with a period. Never "IRIS" in user-facing copy.
- **Tagline:** "See the world differently."
- **Attribution:** Every touchpoint carries "Powered by CNIB"
- iris. is "she/her" — she has personality, not just functionality

## Context Documents
Read these before making architectural decisions:
- `.claude/docs/ENGINEERING-SPEC.md` — Target architecture, component breakdown, API design
- `.claude/docs/BRAND-SPEC.md` — Full brand package, member archetypes, conversation design
- `.claude/docs/CRISIS-PROTOCOLS.md` — Safety-critical crisis response (supersedes everything)
- `.claude/docs/KNOWLEDGE-BASE.md` — Sight loss conditions, lived experience, voice principles
- `.claude/docs/EDGE-CASES.md` — 150 real conversation scenarios iris. must handle
- `.claude/docs/PROGRAM-MAP.md` — Full CNIB program ecosystem iris. draws from

## Deployment
- Push to `main` branch triggers Vercel auto-deploy
- Live at https://meet-iris-app.vercel.app/
- Serverless functions in `/api/` directory
- Environment variables: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` (set in Vercel dashboard)

## Working With Cowork
Strategy, brand decisions, Angela meetings, and product direction happen in Cowork (Jacob's desktop session). Engineering specs and decisions flow INTO this repo via commits. If you see updates to `.claude/docs/`, those came from Cowork. Read them — they're authoritative.
