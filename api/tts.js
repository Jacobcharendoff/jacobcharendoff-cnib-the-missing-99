// Vercel serverless function: Iris TTS proxy
// Primary: ElevenLabs (expressive, per-persona custom voices).
// Fallback: OpenAI tts-1 (auto-fires when ElevenLabs is down, quota-exceeded,
// misconfigured, etc). This keeps the site from ever going voice-silent.
// Frontend POSTs { text, voice } and gets back audio/mpeg.

export const config = { runtime: 'edge' };

// Voice routing — each persona gets its own ElevenLabs voice for the auto-playing scenarios.
const VOICE_MAP = {
  iris:     process.env.ELEVENLABS_VOICE_IRIS     || 'NtS6nEHDYMQC9QczMQuq',
  narrator: process.env.ELEVENLABS_VOICE_NARRATOR || 'NtS6nEHDYMQC9QczMQuq',
  margaret: process.env.ELEVENLABS_VOICE_MARGARET || 'XrExE9yKIg1WjnnlVkGX',
  david:    process.env.ELEVENLABS_VOICE_DAVID    || 'nPczCjzI2devNBz1zQrb',
  priya:    process.env.ELEVENLABS_VOICE_PRIYA    || 'EXAVITQu4vr4xnSDxMaL',
};
const VOICE_SETTINGS = {
  iris:     { stability: 0.42, similarity_boost: 0.80, style: 0.55, use_speaker_boost: true, speed: 1.0 },
  narrator: { stability: 0.62, similarity_boost: 0.82, style: 0.30, use_speaker_boost: true, speed: 1.0 },
  margaret: { stability: 0.55, similarity_boost: 0.82, style: 0.45, use_speaker_boost: true, speed: 0.93 },
  david:    { stability: 0.58, similarity_boost: 0.80, style: 0.35, use_speaker_boost: true, speed: 1.0 },
  priya:    { stability: 0.40, similarity_boost: 0.80, style: 0.58, use_speaker_boost: true, speed: 1.0 },
};
const MODEL = 'eleven_multilingual_v2';

// OpenAI tts-1 fallback map. These are OpenAI's built-in voices, chosen to
// roughly match each persona's vibe. Iris = nova (bright, warm, upbeat).
// tts-1 (not tts-1-hd) for lower latency on live chat streaming.
const OPENAI_VOICE_MAP = {
  iris:     'nova',
  narrator: 'nova',
  margaret: 'shimmer',
  david:    'onyx',
  priya:    'nova',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
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

  // ---- Try ElevenLabs first ----
  const elKey = process.env.ELEVENLABS_API_KEY;
  if (elKey) {
    try {
      const VOICE_ID = VOICE_MAP[requestedVoice] || VOICE_MAP.iris;
      const voice_settings = VOICE_SETTINGS[requestedVoice] || VOICE_SETTINGS.iris;
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
        }
      );
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

  // ---- Fallback: OpenAI tts-1 ----
  const oaKey = process.env.OPENAI_API_KEY;
  if (!oaKey) {
    return new Response('Neither ELEVENLABS_API_KEY nor OPENAI_API_KEY configured', { status: 500 });
  }
  const openaiVoice = OPENAI_VOICE_MAP[requestedVoice] || 'nova';
  const oa = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${oaKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: openaiVoice,
      input: text,
      response_format: 'mp3',
      speed: 1.05, // Slightly peppier than default — keeps Iris from sounding sluggish.
    }),
  });
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
