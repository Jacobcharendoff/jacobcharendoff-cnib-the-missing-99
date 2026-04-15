// Vercel serverless function: Iris TTS proxy
// Primary: ElevenLabs (expressive, per-persona custom voices).
// Fallback: OpenAI gpt-4o-mini-tts (auto-fires when ElevenLabs is down,
// quota-exceeded, misconfigured, etc). This keeps the site from ever going
// voice-silent. Frontend POSTs { text, voice } and gets back audio/mpeg.

export const config = { runtime: 'edge' };

// ===== Origin allow-list =====
const ALLOWED_ORIGINS = new Set([
  'https://meet-iris-app.vercel.app',
  'https://iris-2-bay.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
]);

function checkOrigin(request) {
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  if (ALLOWED_ORIGINS.has(origin)) return true;
  for (const ok of ALLOWED_ORIGINS) {
    if (referer.startsWith(ok + '/') || referer === ok) return true;
  }
  return false;
}

// ===== Rate limiting =====
// TTS is the expensive one — ElevenLabs charges per character. Cap at
// 30 requests / 60 seconds per IP. Override with IRIS_TTS_RATE_LIMIT.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = parseInt(process.env.IRIS_TTS_RATE_LIMIT || '30', 10);
const rateBuckets = new Map();

function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for') || '';
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'anonymous';
}

function rateLimitExceeded(ip) {
  const now = Date.now();
  const arr = rateBuckets.get(ip) || [];
  const fresh = arr.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_MAX) {
    rateBuckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  if (rateBuckets.size > 5000) {
    for (const [key, stamps] of rateBuckets) {
      const live = stamps.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (live.length === 0) rateBuckets.delete(key);
      else rateBuckets.set(key, live);
    }
  }
  return false;
}

// Upstream timeout — ElevenLabs/OpenAI must respond within 20s or abort.
const UPSTREAM_TIMEOUT_MS = 20000;
// Text cap — hard ceiling. Was 2000; tightened to 1500 because an attacker
// with no rate limit could multiply ElevenLabs spend linearly with length.
const TEXT_MAX = 1500;

// Voice routing — each persona gets its own ElevenLabs voice for the auto-playing scenarios.
const VOICE_MAP = {
  iris:     process.env.ELEVENLABS_VOICE_IRIS     || 'NtS6nEHDYMQC9QczMQuq',
  margaret: process.env.ELEVENLABS_VOICE_MARGARET || 'XrExE9yKIg1WjnnlVkGX',
  david:    process.env.ELEVENLABS_VOICE_DAVID    || 'nPczCjzI2devNBz1zQrb',
  priya:    process.env.ELEVENLABS_VOICE_PRIYA    || 'EXAVITQu4vr4xnSDxMaL',
};
const VOICE_SETTINGS = {
  iris:     { stability: 0.42, similarity_boost: 0.80, style: 0.55, use_speaker_boost: true, speed: 1.0 },
  margaret: { stability: 0.55, similarity_boost: 0.82, style: 0.45, use_speaker_boost: true, speed: 0.93 },
  david:    { stability: 0.58, similarity_boost: 0.80, style: 0.35, use_speaker_boost: true, speed: 1.0 },
  priya:    { stability: 0.40, similarity_boost: 0.80, style: 0.58, use_speaker_boost: true, speed: 1.0 },
};
const MODEL = 'eleven_multilingual_v2';

// OpenAI TTS fallback voices. gpt-4o-mini-tts uses an "instructions" string
// to steer tone — much closer to "warm friend on the phone" than tts-1/tts-1-hd.
const OPENAI_VOICE_MAP = {
  iris:     'shimmer', // warm, grounded, more conversational than nova
  narrator: 'ash',     // male, warm, measured — docent voice for the product demo
  margaret: 'sage',    // distinguished older feminine — louder projection than coral
  david:    'onyx',    // mature calm male
  priya:    'nova',    // younger forward energy
};
// Per-persona tone instructions (gpt-4o-mini-tts). These steer delivery
// toward warmth and realness, including pacing (since gpt-4o-mini-tts
// doesn't take a numeric speed param — you steer pace via the text).
const OPENAI_INSTRUCTIONS = {
  iris:     "Speak like a warm, caring friend on the phone — present, alert, animated, lightly smiling. BRISK conversational pace — match the energy of a real person talking, not someone reading aloud. Short, breathy pauses only. Project at a clear, full speaking volume — audible and warm, never breathy or soft. You are not reading; you are talking to one person you already like and you want to reach them quickly.",
  narrator: "Speak like a confident product presenter walking one person through a live demo. Warm but objective. Brisk, conversational pace — never slow, never theatrical, never 'audiobook'. Slight smile in the voice. You're pointing things out as they happen on screen. Pauses are for effect, not tempo. Project at a clear, full speaking volume. You believe what you're saying and you're a little excited about it.",
  margaret: "Speak like a 68-year-old retired schoolteacher who is composed on the phone — she's taught thirty years of classrooms, her default is a CLEAR, PROJECTED voice, not a whisper. Gentle and thoughtful, but audible. At normal conversational pace. Real but brief pauses. One small sigh is okay. DO NOT mumble, fade, or sound breathy. She's measured, not quiet.",
  david:    "Speak like a 42-year-old man holding it together in a hard moment. Controlled, slightly clipped, real. Natural conversational pace, projected at clear speaking volume. Not dramatic.",
  priya:    "Speak like an exhausted mother who is still trying to be warm. Forward-leaning energy, natural pace, trails off only at the end of a thought. Projected clearly — not whispered. Real, unpolished.",
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // ===== Origin allow-list =====
  if (!checkOrigin(req)) {
    return new Response('Forbidden', { status: 403 });
  }

  // ===== Rate limit =====
  const clientIp = getClientIp(req);
  if (rateLimitExceeded(clientIp)) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': '30' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const text = (body.text || '').toString().slice(0, TEXT_MAX);
  if (!text) {
    return new Response('Missing text', { status: 400 });
  }

  const requestedVoice = (body.voice || 'iris').toString().toLowerCase();

  // ---- Try ElevenLabs first ----
  const elKey = process.env.ELEVENLABS_API_KEY;
  if (elKey) {
    try {
      const VOICE_ID = VOICE_MAP[requestedVoice] || VOICE_MAP.iris;
      const voice_settings = VOICE_SETTINGS[requestedVoice] || VOICE_SETTINGS.iris;
      const elCtrl = new AbortController();
      const elTimeout = setTimeout(() => elCtrl.abort(), UPSTREAM_TIMEOUT_MS);
      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elKey,
          },
          body: JSON.stringify({
            text,
            model_id: MODEL,
            voice_settings,
            optimize_streaming_latency: 2,
          }),
          signal: elCtrl.signal,
        }
      ).finally(() => clearTimeout(elTimeout));
      if (upstream.ok) {
        return new Response(upstream.body, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-store',
            'X-TTS-Provider': 'elevenlabs',
          },
        });
      }
      // ElevenLabs returned an error (quota, auth, bad voice id, etc). Log and fall through.
      const errText = await upstream.text();
      console.warn('[tts] ElevenLabs failed, falling back to OpenAI:', upstream.status, errText.slice(0, 200));
    } catch (e) {
      console.warn('[tts] ElevenLabs threw, falling back to OpenAI:', e && e.message);
    }
  }

  // ---- Fallback: OpenAI gpt-4o-mini-tts ----
  // Steerable via instructions string. No numeric speed param — pacing is
  // baked into the instructions text per persona.
  const oaKey = process.env.OPENAI_API_KEY;
  if (!oaKey) {
    return new Response('Neither ELEVENLABS_API_KEY nor OPENAI_API_KEY configured', { status: 500 });
  }
  const openaiVoice = OPENAI_VOICE_MAP[requestedVoice] || 'shimmer';
  const instructions = OPENAI_INSTRUCTIONS[requestedVoice] || OPENAI_INSTRUCTIONS.iris;

  const oaCtrl = new AbortController();
  const oaTimeout = setTimeout(() => oaCtrl.abort(), UPSTREAM_TIMEOUT_MS);
  const oa = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${oaKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: openaiVoice,
      input: text,
      instructions,
      response_format: 'mp3',
    }),
    signal: oaCtrl.signal,
  }).finally(() => clearTimeout(oaTimeout));
  if (!oa.ok) {
    const errText = await oa.text();
    return new Response(`OpenAI TTS error: ${errText}`, { status: oa.status });
  }
  return new Response(oa.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      'X-TTS-Provider': 'openai',
    },
  });
}
