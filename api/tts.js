// Vercel serverless function: ElevenLabs TTS proxy
// Keeps the API key server-side. Frontend POSTs { text } and gets back audio/mpeg.

export const config = { runtime: 'edge' };

// Voice routing — each persona gets its own ElevenLabs voice for the auto-playing scenarios.
// Defaults are public ElevenLabs library voices (available on every account).
// Override any of them via Vercel env vars (e.g. ELEVENLABS_VOICE_MARGARET).
const VOICE_MAP = {
  iris:     process.env.ELEVENLABS_VOICE_IRIS     || 'NtS6nEHDYMQC9QczMQuq', // Iris (current custom)
  narrator: process.env.ELEVENLABS_VOICE_NARRATOR || 'NtS6nEHDYMQC9QczMQuq', // Same as Iris
  margaret: process.env.ELEVENLABS_VOICE_MARGARET || 'XrExE9yKIg1WjnnlVkGX', // Matilda — warm mature female
  david:    process.env.ELEVENLABS_VOICE_DAVID    || 'nPczCjzI2devNBz1zQrb', // Brian — calm professional male
  priya:    process.env.ELEVENLABS_VOICE_PRIYA    || 'EXAVITQu4vr4xnSDxMaL', // Sarah — younger female
};
const MODEL = 'eleven_turbo_v2_5';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response('ELEVENLABS_API_KEY not configured', { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const text = (body.text || '').toString().slice(0, 2000);
  if (!text) {
    return new Response('Missing text', { status: 400 });
  }

  const requestedVoice = (body.voice || 'iris').toString().toLowerCase();
  const VOICE_ID = VOICE_MAP[requestedVoice] || VOICE_MAP.iris;

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: {
          stability: 0.32,
          similarity_boost: 0.78,
          style: 0.55,
          use_speaker_boost: true,
          speed: 1.08,
        },
        optimize_streaming_latency: 3,
      }),
    }
  );

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(`ElevenLabs error: ${errText}`, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
