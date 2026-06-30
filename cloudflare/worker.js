/**
 * ChadWallet API proxy (Cloudflare Worker).
 *
 * Hides the Birdeye + Codex secret keys from the mobile bundle. The app calls:
 *   GET  {WORKER_URL}/birdeye/<birdeye-path>?<query>
 *   POST {WORKER_URL}/codex/graphql
 * and this worker injects the API keys and forwards upstream.
 *
 * Deploy:
 *   cd cloudflare
 *   npm i -g wrangler
 *   wrangler secret put BIRDEYE_API_KEY
 *   wrangler secret put CODEX_API_KEY
 *   wrangler deploy
 *
 * Then set EXPO_PUBLIC_API_PROXY_URL to the deployed workers.dev URL.
 */

const BIRDEYE_BASE = 'https://public-api.birdeye.so';
const CODEX_BASE = 'https://graph.codex.io';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const { pathname, search } = url;

    try {
      if (pathname.startsWith('/birdeye/')) {
        const upstreamPath = pathname.replace('/birdeye', '');
        const res = await fetch(`${BIRDEYE_BASE}${upstreamPath}${search}`, {
          headers: {
            'X-API-KEY': env.BIRDEYE_API_KEY,
            'x-chain': 'solana',
            accept: 'application/json',
          },
        });
        return withCors(res);
      }

      if (pathname.startsWith('/codex/')) {
        const res = await fetch(`${CODEX_BASE}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: env.CODEX_API_KEY,
          },
          body: request.body,
        });
        return withCors(res);
      }

      return new Response('Not found', { status: 404, headers: CORS });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
  },
};

async function withCors(res) {
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      ...CORS,
      'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
    },
  });
}
