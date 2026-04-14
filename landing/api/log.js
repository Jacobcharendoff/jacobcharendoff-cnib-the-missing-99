// Vercel serverless function: iris. session logger.
//
// Receives fire-and-forget POST from the browser and forwards the
// session payload to the webhook set via LOG_WEBHOOK_URL env var.
// If the env var is missing, we silently 204 — the front-end MUST NOT
// break if logging is down. This file never crashes the caller.

export const config = { runtime: 'edge' };

// Allow-list of origins that may POST to this endpoint
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

// Simple non-cryptographic hash so we don't forward raw IPs.
// Good enough to dedupe sessions; not reversible to an IP.
async function hashIP(ip) {
  if (!ip) return null;
  try {
    const data = new TextEncoder().encode(String(ip) + '|iris-salt-v1');
    const buf = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(buf))
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex; // 16-char hex prefix
  } catch (_) {
    return null;
  }
}

export default async function handler(request) {
  // Health check
  if (request.method === 'GET') {
    const hasWebhook = !!process.env.LOG_WEBHOOK_URL;
    return new Response(
      JSON.stringify({
        ok: true,
        service: 'iris-log',
        webhookConfigured: hasWebhook,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  // Origin check — reject cross-origin abuse
  if (!checkOrigin(request)) {
    return new Response(null, { status: 403 });
  }

  // Never throw back to the client. Every branch returns 204.
  try {
    const webhook = process.env.LOG_WEBHOOK_URL;
    // If no webhook configured, just 204 — logging is optional.
    if (!webhook) {
      return new Response(null, { status: 204 });
    }

    // Parse body safely
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      return new Response(null, { status: 204 });
    }

    // Enrich — hash IP, keep geo coarse, strip nothing else for now
    const rawIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const ipHash = await hashIP(rawIP);
    const geo = request.geo || null; // Vercel Edge attaches this
    const ua = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || null;

    const enriched = {
      ...body,
      ipHash, // hashed, not raw
      geo,
      ua: body.ua || ua,
      referrer: body.referrer || referrer,
    };

    // Fire-and-forget forward with a timeout so the edge function
    // doesn't hang indefinitely.
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    const forwardPromise = fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
      signal: ctrl.signal,
    })
      .catch((err) => {
        console.warn('[iris-log] forward failed:', err && err.message);
      })
      .finally(() => clearTimeout(timeout));

    // For 'end' events, wait up to 2.5s so Vercel doesn't tear down
    // the edge function before the webhook completes.
    if (body && body.phase === 'end') {
      try {
        await Promise.race([
          forwardPromise,
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      } catch (_) {}
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.warn('[iris-log] handler error:', err && err.message);
    return new Response(null, { status: 204 });
  }
}
