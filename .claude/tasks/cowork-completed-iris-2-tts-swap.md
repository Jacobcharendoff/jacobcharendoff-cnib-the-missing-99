# Cowork → Claude Code handoff — April 14, 2026

Session completed three things Claude Code should know about before touching
`iris-2.0` again.

## 1. ElevenLabs is confirmed dead for now

- Key is valid. Account is at **0 / 100,000 credits remaining**.
- Tested directly against `POST /v1/text-to-speech/NtS6nEHDYMQC9QczMQuq/stream`
  with the production key. Returned `401 quota_exceeded: "You have 0 credits
  remaining, while 5 credits are required for this request."`
- Jacob decided **not to top up at this point**. Assume ElevenLabs is offline
  for the foreseeable future. OpenAI fallback is the production voice stack.
- When credits eventually land, ElevenLabs will automatically resume — no
  code or env changes needed. The primary path in `tts.js` is untouched.

## 2. OpenAI fallback switched to gpt-4o-mini-tts

Two commits on `iris-2.0`:
- `a7c14ce` — api/tts.js: tts-1-hd → gpt-4o-mini-tts
- `e9183cb` — landing/api/tts.js: same change

Why: `tts-1-hd` ignores the `instructions` field, so all the per-persona tone
strings you wrote ("warm caring friend on the phone" for iris, "68-year-old
holding it together" for Margaret, etc.) were dead code. `gpt-4o-mini-tts`
uses them. This is the single biggest quality bump available while ElevenLabs
is offline.

Also dropped the numeric `speed` field. `gpt-4o-mini-tts` ignores it — pace
has to be steered via the instructions text. Pace guidance is now baked into
each persona's instructions string ("take your time, let the thoughts land"
for Margaret, "slightly faster than conversational pace" for Priya).

**Do not revert this.** If Claude Code sees `tts-1-hd` vs `gpt-4o-mini-tts`
in a diff review, leave gpt-4o-mini-tts in place.

## 3. iris-2-bay Vercel project is now fully functional

Previously had zero env vars, which is why audio was silent there.

- `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` are now set on iris-2 (all three
  environments: Production, Preview, Development). Copied via Vercel API
  from the meet-iris project.
- Redeployed. `/api/chat` returns 200 with JSON `text` field. `/api/tts`
  returns 200 audio/mpeg (via OpenAI fallback, as expected).

## 4. Deployment path — Option A selected

- Don't merge straight to main.
- Use Vercel's preview URL for branch `iris-2.0` on the `meet-iris-app`
  project to review.
- Jacob will merge `iris-2.0` → `main` after reviewing the preview.
- iris-2-bay project to be deleted after merge to main is verified.

## 5. Samples were generated for Jacob to audition

Four gpt-4o-mini-tts samples (one per persona) were played in-browser on
iris-2-bay. Jacob is listening before the VO script review with Angela.
No files need to be added to the repo.

## Open items Claude Code can pick up next (lower priority than Jacob's merge)

- Scene 8 data shape: extend `demo-data.js` to include the 5-row SLA shape,
  plus `npsSeries` / `repeatEngagement` / `pipeline` fields the partner
  dashboard scene expects. Currently renders placeholders.
- VO script v2 for Angela's review — rewrite the 8 `DATA.irisVO` lines
  against the iris brand voice, commit as a diff for Angela to react to.
- Accessibility pass — NVDA/VoiceOver audit of the new 11-scene tour.

— Cowork
