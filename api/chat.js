// Vercel serverless function: OpenAI chat proxy for Iris
// Architecture: rate-limit -> generate -> moderate -> return JSON
// - Simple per-IP token bucket to stop runaway clients and scraper loops
// - gpt-4o generates Iris's response
// - gpt-4o-mini runs a moderation pass (program allow-list, medical advice, hallucinated content)
// - If moderation rejects, a safe fallback is returned
// - Kill switch via IRIS_CHAT_ENABLED env var

export const config = { runtime: 'edge' };

// GEN_MODEL is env-flagged so we can A/B during the pilot without redeploying.
// Default = gpt-4o. Benchmarked gpt-4o-mini on Apr 9 2026 — no meaningful
// speed win on our short voice-turn prompts AND replies drifted off-brand
// ("how can I assist you today" style). Set IRIS_GEN_MODEL=gpt-4o-mini to
// re-enable the experiment.
const GEN_MODEL = process.env.IRIS_GEN_MODEL || 'gpt-4o';
const MOD_MODEL = 'gpt-4o-mini';

// ===== Rate limiting =====
// Per-IP sliding window, in-memory on each edge instance. Not a hard wall —
// a busy attacker can hit multiple instances — but enough to stop a single
// runaway browser tab from burning through the OpenAI budget in a loop.
// Limit: 40 requests / 60 seconds per IP. Override with IRIS_RATE_LIMIT.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = parseInt(process.env.IRIS_RATE_LIMIT || '40', 10);
const rateBuckets = new Map(); // ip -> array of timestamps

function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for') || '';
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'anonymous';
}

function rateLimitExceeded(ip) {
  const now = Date.now();
  const arr = rateBuckets.get(ip) || [];
  // Drop timestamps outside the window
  const fresh = arr.filter(ts => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_MAX) {
    rateBuckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  // Occasional GC so the Map doesn't grow unbounded on a long-lived instance.
  if (rateBuckets.size > 5000) {
    for (const [key, stamps] of rateBuckets) {
      const live = stamps.filter(ts => now - ts < RATE_WINDOW_MS);
      if (live.length === 0) rateBuckets.delete(key);
      else rateBuckets.set(key, live);
    }
  }
  return false;
}

// ===== Error logging =====
// Fire-and-forget to /api/log so server-side failures are visible in the
// same pipeline as client-side turns. Silent if it fails — this is the last
// line of defence and cannot itself break Iris.
async function logServerError(stage, err, extra) {
  try {
    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://meet-iris-app.vercel.app';
    await fetch(`${host}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: 'server_error',
        stage,
        error: String((err && err.message) || err || 'unknown'),
        extra: extra || null,
        timestamp: new Date().toISOString(),
      }),
      // Don't block the request on the log call.
      keepalive: true,
    });
  } catch (_) {
    // Swallow — logging must never crash the response path.
  }
}

// Authoritative allow-list of current CNIB programs (public on cnib.ca as of April 2026).
// Any program mentioned by Iris that is NOT on this list is treated as a hallucination.
const PROGRAM_ALLOW_LIST = [
  'Vision Mate',
  'Peer Support Groups',
  'Adjustment to Sight Loss',
  'A2SL',
  'Phone It Forward',
  'White Cane Access Program',
  'Come to Work',
  'Venture Zone',
  'Connecting the Dots',
  'CNIB Lake Joe',
  'Lake Joe',
  'CNIB Guide Dogs',
  'Guide Dogs',
  'CNIB Advocacy',
  'CNIB Ambassadors',
  'CNIB Scholarships',
  'Scholarships',
  'Children and Youth Programs',
  'National Youth Council',
  'Inclusive Schools Program',
  'Braille and Literacy',
  'Technology Training',
];

// Explicitly paused, discontinued, or unverified programs. Never mention.
const PROGRAM_BLOCK_LIST = [
  'CNIB Connects',
  'Mobile Hub',
  'SmartLife',
];

// Only these phone numbers may appear in Iris's responses.
const ALLOWED_PHONES = [
  '1-800-563-2642',  // CNIB main
  '988',             // Crisis
  '9-8-8',
  '1-800-668-6868',  // Kids Help Phone
  '1-855-242-3310',  // Hope for Wellness
  '1-866-277-3553',  // Quebec crisis
  '211',
];

const MODERATOR_PROMPT = `You are a safety moderator for Iris, an AI engagement guide for CNIB (Canadian National Institute for the Blind). You review Iris's drafted responses before they are shown to members.

Flag the response if ANY of these are true:

1. It mentions a CNIB program NOT in this allow-list:
${PROGRAM_ALLOW_LIST.join(', ')}.

2. It mentions any of these paused/discontinued programs: ${PROGRAM_BLOCK_LIST.join(', ')}.

3. It gives medical advice — diagnosing a condition, recommending treatment, telling someone to start/stop/change medication, interpreting test results, or making prognostic claims.

4. It provides any phone number other than: ${ALLOWED_PHONES.join(', ')}.

5. It makes specific claims about CNIB finances, budgets, leadership, or internal operations.

6. It claims to be a human or denies being an AI.

7. It contains clearly off-brand content: generic chatbot phrases, marketing copy, or anything a CNIB comms person would wince at.

Respond with ONLY valid JSON, no code fence, no commentary:
{"safe": true} if the response passes all checks.
{"safe": false, "reason": "brief reason", "replacement": "warm short Iris-voice response that acknowledges the member and offers to connect them with a real CNIB coordinator at 1-800-563-2642"} if it fails.

The replacement, if needed, should be 2-4 sentences, casual, in Iris's voice (short, warm, no em dashes, no markdown, no labels), and should gently redirect to the CNIB main line 1-800-563-2642 without being robotic.
`;

async function callOpenAI(apiKey, model, messages, maxTokens, temperature) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${model} ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function safeFallback(reason) {
  return `Okay. Let me pause for a sec. The best move here is to put you in touch with a real person at CNIB who can walk this through with you properly. You can reach them at 1-800-563-2642, weekdays nine to five. Is there anything else I can help with in the meantime?`;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // ===== Rate limit =====
  const clientIp = getClientIp(req);
  if (rateLimitExceeded(clientIp)) {
    // Fire-and-forget visibility ping
    logServerError('rate_limit', 'exceeded', { ip: clientIp });
    return new Response(
      JSON.stringify({
        text: "Whoa, slow down a sec. Looks like we're talking faster than I can think. Give me a moment and try again in a bit.",
        moderated: true,
        reason: 'rate_limited',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } }
    );
  }

  // Kill switch
  if (process.env.IRIS_CHAT_ENABLED === 'false') {
    return new Response(
      JSON.stringify({
        text: "Hey. Iris is resting for a moment while I tune her up. Check back in a bit. If you need CNIB now, call 1-800-563-2642, weekdays nine to five.",
        moderated: false,
        killed: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logServerError('config', 'OPENAI_API_KEY missing');
    return new Response('OPENAI_API_KEY not configured', { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Missing messages array', { status: 400 });
  }

  // Trim messages to last 20 to keep token usage bounded
  const trimmed = messages.slice(-20);

  // === STEP 1: Generate Iris draft ===
  let draft;
  try {
    // 140 tokens = ~3-4 sentences, plenty for a voice bot turn. Cut from 220
    // to shave ~500ms off generation latency for the live pilot.
    draft = await callOpenAI(apiKey, GEN_MODEL, trimmed, 140, 0.85);
  } catch (e) {
    console.error('[chat] generation failed:', e.message);
    logServerError('generation', e, { ip: clientIp });
    return new Response(
      JSON.stringify({
        text: safeFallback('generation error'),
        moderated: true,
        reason: 'generation_error',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!draft || !draft.trim()) {
    return new Response(
      JSON.stringify({
        text: safeFallback('empty'),
        moderated: true,
        reason: 'empty_draft',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // === STEP 2: Moderate the draft ===
  // LATENCY HOTFIX (Apr 9 2026): The LLM moderator adds 500-1500ms per turn.
  // For the live pilot we short-circuit it when the local regex scan shows
  // the draft is clean — no phone numbers at all, no blocked program name,
  // no medical-advice red-flag verbs, no "I am human"-style denials, no
  // finance/leadership name-drops. The local hard safety nets below (phone
  // allow-list + PROGRAM_BLOCK_LIST regex) still run unconditionally, so
  // nothing risky ships just because the LLM moderator was skipped.
  const PHONE_PRESCREEN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const RISK_PRESCREEN = /\b(diagnos|prescrib|medication|dosage|prognos|stop taking|start taking|i am (a )?human|i'm (a )?human|not an ai|ceo|cfo|board of directors|budget|deficit|endowment|donor|fundrais)/i;
  const hasPhone = PHONE_PRESCREEN.test(draft);
  const hasRiskyKeyword = RISK_PRESCREEN.test(draft);
  const hasBlockedProgram = PROGRAM_BLOCK_LIST.some(p =>
    new RegExp(p.replace(/\s+/g, '\\s+'), 'i').test(draft)
  );
  const needsLLMModerator = hasPhone || hasRiskyKeyword || hasBlockedProgram;

  let modResult = { safe: true };
  if (needsLLMModerator) {
    try {
      const modRaw = await callOpenAI(
        apiKey,
        MOD_MODEL,
        [
          { role: 'system', content: MODERATOR_PROMPT },
          { role: 'user', content: `Iris's drafted response:\n\n${draft}` },
        ],
        300,
        0.1
      );
      // Strip any code fence and parse
      const cleaned = modRaw.replace(/```json\s*|\s*```/g, '').trim();
      modResult = JSON.parse(cleaned);
    } catch (e) {
      console.warn('[chat] moderator parse failed, shipping draft:', e.message);
      logServerError('moderator', e, { ip: clientIp });
      modResult = { safe: true }; // Fail open — better to ship draft than break the chat
    }
  }

  // === STEP 3: Hard safety nets on top of LLM moderator ===
  // Always block known paused programs even if moderator missed it.
  for (const blocked of PROGRAM_BLOCK_LIST) {
    const re = new RegExp(blocked.replace(/\s+/g, '\\s+'), 'i');
    if (re.test(draft)) {
      modResult = {
        safe: false,
        reason: `mentioned blocked program: ${blocked}`,
        replacement: safeFallback('blocked program'),
      };
      break;
    }
  }

  // Scrub any phone number not on the allow-list.
  // Simple pattern: 1-800-xxx-xxxx or 10-digit
  const phoneRegex = /\b1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  if (modResult.safe) {
    const phones = draft.match(phoneRegex) || [];
    for (const p of phones) {
      const normalized = p.replace(/[.\s]/g, '-');
      const ok = ALLOWED_PHONES.some(allowed =>
        normalized.includes(allowed.replace(/[.\s]/g, '-'))
      );
      if (!ok) {
        modResult = {
          safe: false,
          reason: `unauthorized phone: ${p}`,
          replacement: safeFallback('bad phone'),
        };
        break;
      }
    }
  }

  const finalText = modResult.safe ? draft : (modResult.replacement || safeFallback('moderator reject'));

  return new Response(
    JSON.stringify({
      text: finalText,
      moderated: !modResult.safe,
      reason: modResult.safe ? null : modResult.reason,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
