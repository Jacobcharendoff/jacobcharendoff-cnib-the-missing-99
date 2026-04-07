// Vercel serverless function: ElevenLabs TTS proxy
// Keeps the API key server-side. Frontend POSTs { text } and gets back audio/mpeg.

export const config = { runtime: 'edge' };

const VOICE_ID = 'NtS6nEHDYMQC9QczMQuq';
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
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
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
