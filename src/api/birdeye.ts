import { marketFetch } from './http';
import {
  ChartRange,
  PricePoint,
  TokenOverview,
  TokenTrade,
  TrendingToken,
} from './types';

// ---------------------------------------------------------------------------
// Birdeye Public API client (https://docs.birdeye.so)
// Free tier: standard endpoints. All calls routed via marketFetch so the API
// key is injected by the Cloudflare Worker (or a dev key locally).
// ---------------------------------------------------------------------------

interface BirdeyeEnvelope<T> {
  success: boolean;
  data: T;
}

interface BirdeyeTrendingItem {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  price: number;
  price24hChangePercent?: number;
  volume24hUSD?: number;
  marketcap?: number;
  liquidity?: number;
  rank?: number;
}

export async function fetchTrendingTokens(limit = 20): Promise<TrendingToken[]> {
  const res = await marketFetch<BirdeyeEnvelope<{ tokens: BirdeyeTrendingItem[] }>>(
    'birdeye',
    `/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=${limit}`,
  );
  const tokens = res.data?.tokens ?? [];
  return tokens.map((t) => ({
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    logoURI: t.logoURI,
    decimals: t.decimals,
    price: t.price ?? 0,
    priceChange24h: t.price24hChangePercent ?? 0,
    volume24h: t.volume24hUSD ?? 0,
    marketCap: t.marketcap,
    liquidity: t.liquidity,
    rank: t.rank,
  }));
}

interface BirdeyeOverview {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24hPercent?: number;
  liquidity?: number;
  v24hUSD?: number;
  mc?: number;
  fdv?: number;
  holder?: number;
  supply?: number;
  extensions?: { website?: string; twitter?: string };
}

export async function fetchTokenOverview(address: string): Promise<TokenOverview> {
  const res = await marketFetch<BirdeyeEnvelope<BirdeyeOverview>>(
    'birdeye',
    `/defi/token_overview?address=${address}`,
  );
  const d = res.data;
  return {
    address: d.address,
    symbol: d.symbol,
    name: d.name,
    decimals: d.decimals,
    logoURI: d.logoURI,
    price: d.price ?? 0,
    priceChange24h: d.priceChange24hPercent ?? 0,
    marketCap: d.mc,
    fdv: d.fdv,
    liquidity: d.liquidity,
    volume24h: d.v24hUSD ?? 0,
    holders: d.holder,
    supply: d.supply,
    website: d.extensions?.website,
    twitter: d.extensions?.twitter,
  };
}

const RANGE_CONFIG: Record<ChartRange, { type: string; seconds: number }> = {
  '1H': { type: '1m', seconds: 60 * 60 },
  '1D': { type: '15m', seconds: 60 * 60 * 24 },
  '1W': { type: '1H', seconds: 60 * 60 * 24 * 7 },
  '1M': { type: '4H', seconds: 60 * 60 * 24 * 30 },
};

export async function fetchPriceHistory(
  address: string,
  range: ChartRange,
): Promise<PricePoint[]> {
  const { type, seconds } = RANGE_CONFIG[range];
  const now = Math.floor(Date.now() / 1000);
  const res = await marketFetch<BirdeyeEnvelope<{ items: PricePoint[] }>>(
    'birdeye',
    `/defi/history_price?address=${address}&address_type=token&type=${type}&time_from=${
      now - seconds
    }&time_to=${now}`,
  );
  return res.data?.items ?? [];
}

interface BirdeyeTrade {
  txHash: string;
  side: 'buy' | 'sell';
  owner: string;
  blockUnixTime: number;
  volumeUSD?: number;
  to?: { uiAmount?: number; price?: number };
  from?: { uiAmount?: number; price?: number };
}

export async function fetchTokenTrades(address: string, limit = 25): Promise<TokenTrade[]> {
  const res = await marketFetch<BirdeyeEnvelope<{ items: BirdeyeTrade[] }>>(
    'birdeye',
    `/defi/txs/token?address=${address}&tx_type=swap&sort_type=desc&offset=0&limit=${limit}`,
  );
  const items = res.data?.items ?? [];
  return items.map((t) => ({
    txHash: t.txHash,
    side: t.side,
    owner: t.owner,
    priceUsd: t.to?.price ?? t.from?.price ?? 0,
    volumeUsd: t.volumeUSD ?? 0,
    tokenAmount: t.to?.uiAmount ?? t.from?.uiAmount ?? 0,
    unixTime: t.blockUnixTime,
  }));
}

/** Batched USD prices for a set of mints — used to value portfolio holdings. */
export async function fetchMultiPrice(addresses: string[]): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  const list = addresses.join(',');
  const res = await marketFetch<BirdeyeEnvelope<Record<string, { value: number }>>>(
    'birdeye',
    `/defi/multi_price?list_address=${list}`,
  );
  const out: Record<string, number> = {};
  for (const [addr, v] of Object.entries(res.data ?? {})) {
    out[addr] = v?.value ?? 0;
  }
  return out;
}
