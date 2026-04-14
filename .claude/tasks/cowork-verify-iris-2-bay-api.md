# Cowork Task: Verify iris-2-bay API Configuration

**Owner:** Cowork
**Status:** Blocking — required before embedded chat widget port
**Est. time:** 10 minutes

## Why

The landing site at `iris-2-bay.vercel.app` is a **separate Vercel project** from `meet-iris-app.vercel.app`. Its own `/api/*` routes and env vars are required for the embedded live demo to work on the new landing page.

The API route files (`chat.js`, `tts.js`, `log.js`) have already been copied into `landing/api/` in the `iris-2.0` branch. What remains is Vercel-side configuration.

---

## ☐ 1. Confirm Vercel project structure

Vercel dashboard → `iris-2-bay` project → **Settings**

- **Framework Preset:** Other (static HTML)
- **Root Directory:** `landing`
- **Production Branch:** `iris-2.0`
- **Build Command:** (empty / default)
- **Output Directory:** (empty / default)
- **Install Command:** (empty / default)

Confirm Node.js version on Settings → General is `20.x` or higher (the API functions require it).

---

## ☐ 2. Set Environment Variables

Vercel dashboard → `iris-2-bay` project → **Settings → Environment Variables**

Add these **two** env vars for **Production, Preview, and Development** environments:

| Variable Name | Value | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Copy from the `meet-iris-app` Vercel project's env vars (same key) |
| `ELEVENLABS_API_KEY` | `sk_...` | Copy from the `meet-iris-app` Vercel project's env vars (same key) |

**Important:** Env var changes only take effect on the **next deployment**. Trigger a redeploy: Deployments tab → find latest → `⋯` menu → **Redeploy**.

---

## ☐ 3. Smoke-test the API endpoints

Once redeployed, verify from any terminal:

```bash
# Test chat endpoint — should return 200 with a response
curl -X POST https://iris-2-bay.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello iris."}]}'

# Test TTS endpoint — should return 200 with audio/mpeg content
curl -X POST https://iris-2-bay.vercel.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","voice":"iris"}' \
  --output /tmp/iris-test.mp3 && file /tmp/iris-test.mp3
```

**Expected:**
- `/api/chat` → 200 with JSON body containing a `text` field
- `/api/tts` → 200, file output is `Audio file with ID3 version...` or `MPEG audio`

**If either returns 500:**
- Check Vercel → `iris-2-bay` → Deployments → [latest] → **Functions** tab for error logs
- Most common cause: env var missing or misnamed (case-sensitive)
- Second most common: Node version mismatch

---

## ☐ 4. Report back

When done, confirm:
1. Root directory = `landing`, production branch = `iris-2.0`, Node 20+
2. Both env vars set on Production (and preferably Preview too)
3. Both curl tests returned 200

Once confirmed, Claude Code will proceed with porting the chat widget (CSS + JS + modal HTML) into the landing page.

---

## Notes

- Never commit API keys to the repo. They live only in Vercel env vars.
- If Cowork doesn't have access to the `meet-iris-app` project's env vars, Jacob can read them from Vercel dashboard and paste them into `iris-2-bay`.
- These are the SAME keys used by the v1 site. No new keys needed.
