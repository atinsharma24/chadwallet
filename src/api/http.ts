import { ENV } from '@/config/env';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type Service = 'birdeye' | 'codex';

const DIRECT_BASE: Record<Service, string> = {
  birdeye: 'https://public-api.birdeye.so',
  codex: 'https://graph.codex.io',
};

/**
 * Routes a market-data request either through the Cloudflare Worker proxy
 * (preferred — secret keys live in the worker) or directly to the upstream API
 * using a dev-only key (local development before the worker is deployed).
 */
export async function marketFetch<T>(
  service: Service,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };

  let url: string;
  if (ENV.apiProxyUrl) {
    url = `${ENV.apiProxyUrl}/${service}${path}`;
  } else {
    url = `${DIRECT_BASE[service]}${path}`;
    if (service === 'birdeye') {
      headers['x-chain'] = 'solana';
      if (ENV.devBirdeyeKey) headers['X-API-KEY'] = ENV.devBirdeyeKey;
    }
    if (service === 'codex' && ENV.devCodexKey) {
      headers['Authorization'] = ENV.devCodexKey;
    }
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, `${service} ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function jsonFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, `${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}
