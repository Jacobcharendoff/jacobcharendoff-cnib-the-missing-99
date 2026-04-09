// Vercel serverless function: IRIS session logger.
//
// Receives fire-and-forget POST from the browser (client/index.html's
// logIrisEvent pipeline) and forwards the session payload to the
// Google Apps Script webhook that writes the Sheet + emails Jacob.
//
// The webhook URL lives in LOG_WEBHOOK_URL. If the env var is missing,
// we silently 204 — the front-end MUST NOT break if logging is down.

export const config = { runtime: 'edge' };

export default async function handler(request) {
  // Accept both GET (health check) and POST (event push)
  if (request.method === 'GET') {
    return new Response(
      JSON.stringify({
        ok: true,
        service: 'iris-log',
        webhookConfigured: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  // Never throw back to the client. Every branch returns 204/200.
  try {
    // Hardcoded = Apps Script "Iris logger v6 memberFirstName" deployment
    // (Version 6, Apr 9 2026). Overrides the Vercel env var, which still
    // points at an older deployment without memberFirstName support.
    const webhook =
      'https://script.google.com/macros/s/AKfycbyKMjD_WvYtzZrtNH7FfpYkS1lmEh0PGTcrhiUg24PrPB6wEsnN6FxLtEP5TeILHUhI/exec';

    // Parse body safely
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      return new Response(null, { status: 204 });
    }

    // Enrich with server-side signal the browser can't see
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const geo = request.geo || null; // Vercel Edge attaches this on most plans
    const ua = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || null;

    const enriched = {
      ...body,
      ip,
      geo,
      ua: body.ua || ua,
      referrer: body.referrer || referrer,
    };

    // Fire-and-forget forward. We don't await the webhook response body —
    // just kick it off. If it errors, swallow it.
    const forwardPromise = fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    }).catch((err) => {
      // Silent — logging should never break Iris
      console.warn('[iris-log] forward failed:', err && err.message);
    });

    // For 'end' events, actually wait a moment so Vercel doesn't tear down
    // the edge function before the webhook completes. For 'start'/'turn',
    // respond immediately.
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
    // Absolute last-resort catch — still return 204 so the client's
    // fetch/keepalive/sendBeacon never logs an error.
    console.warn('[iris-log] handler error:', err && err.message);
    return new Response(null, { status: 204 });
  }
}
