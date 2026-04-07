// Vercel serverless function: OpenAI chat proxy
// Keeps the API key server-side. Frontend POSTs { messages } and gets back SSE stream.

export const config = { runtime: 'edge' };

const MODEL = 'gpt-4o';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
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

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: trimmed,
      stream: true,
      temperature: 0.85,
      max_tokens: 160,
      presence_penalty: 0.5,
      frequency_penalty: 0.4,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(`OpenAI error: ${errText}`, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
    },
  });
}
