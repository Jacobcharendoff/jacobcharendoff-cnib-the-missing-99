// Vercel edge function: DALL-E 3 image generation proxy
// POST { prompt, size? } → returns raw image/png bytes
// Same origin allow-list and rate limiting as /api/tts

export const config = { runtime: 'edge' };

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

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 10;
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
  if (fresh.length >= RATE_MAX) { rateBuckets.set(ip, fresh); return true; }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  return false;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || '';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!checkOrigin(req)) return new Response('Forbidden', { status: 403 });
  if (rateLimitExceeded(getClientIp(req))) return new Response('Too many requests', { status: 429 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const prompt = (body.prompt || '').toString().slice(0, 3000);
  if (!prompt) return new Response('Missing prompt', { status: 400 });

  // DALL-E 3: 1792x1024 is closest 16:9 available
  const size = body.size || '1792x1024';
  const quality = body.quality || 'standard';

  const oaKey = process.env.OPENAI_API_KEY;
  if (!oaKey) return new Response('OPENAI_API_KEY not configured', { status: 500 });

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 60000);

  let genResp;
  try {
    genResp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${oaKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality, response_format: 'url' }),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    return new Response(`Generation failed: ${e.message}`, { status: 502 });
  }
  clearTimeout(timeout);

  if (!genResp.ok) {
    const err = await genResp.text();
    return new Response(`OpenAI error: ${err}`, { status: genResp.status });
  }

  const json = await genResp.json();
  const imageUrl = json?.data?.[0]?.url;
  if (!imageUrl) return new Response('No image URL returned', { status: 502 });

  // Fetch the image bytes and proxy them back
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) return new Response('Failed to fetch image', { status: 502 });

  const origin = req.headers.get('origin') || '';
  return new Response(imgResp.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
      'X-Image-Model': 'dall-e-3',
    },
  });
}
