import { marketFetch } from './http';
import { PricePoint, TrendingToken } from './types';

// ---------------------------------------------------------------------------
// Codex.io GraphQL client (https://docs.codex.io) — used as a fallback source
// for trending tokens and OHLCV bars when Birdeye is rate-limited.
// Solana networkId on Codex = 1399811149.
// NOTE: free tier only — DO NOT send the $1 USDC payment when signing up.
// ---------------------------------------------------------------------------

export const SOLANA_NETWORK_ID = 1399811149;

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await marketFetch<GraphQLResponse<T>>('codex', '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.errors?.length) throw new Error(`Codex: ${res.errors[0].message}`);
  return res.data as T;
}

const TRENDING_QUERY = `
  query TrendingTokens($networkId: Int!, $limit: Int!) {
    filterTokens(
      filters: { network: [$networkId] }
      rankings: { attribute: volume24, direction: DESC }
      limit: $limit
    ) {
      results {
        token { address symbol name info { imageThumbUrl decimals } }
        priceUSD
        change24
        volume24
        marketCap
        liquidity
      }
    }
  }
`;

interface CodexTrendingResult {
  filterTokens: {
    results: {
      token: {
        address: string;
        symbol: string;
        name: string;
        info?: { imageThumbUrl?: string; decimals?: number };
      };
      priceUSD?: string;
      change24?: string;
      volume24?: string;
      marketCap?: string;
      liquidity?: string;
    }[];
  };
}

export async function fetchTrendingTokensCodex(limit = 20): Promise<TrendingToken[]> {
  const data = await gql<CodexTrendingResult>(TRENDING_QUERY, {
    networkId: SOLANA_NETWORK_ID,
    limit,
  });
  return (data.filterTokens?.results ?? []).map((r, i) => ({
    address: r.token.address,
    symbol: r.token.symbol,
    name: r.token.name,
    logoURI: r.token.info?.imageThumbUrl,
    decimals: r.token.info?.decimals ?? 9,
    price: Number(r.priceUSD ?? 0),
    // Codex `change24` is a ratio (e.g. 0.12 = +12%).
    priceChange24h: Number(r.change24 ?? 0) * 100,
    volume24h: Number(r.volume24 ?? 0),
    marketCap: r.marketCap ? Number(r.marketCap) : undefined,
    liquidity: r.liquidity ? Number(r.liquidity) : undefined,
    rank: i + 1,
  }));
}

const BARS_QUERY = `
  query GetBars($symbol: String!, $from: Int!, $to: Int!, $resolution: String!) {
    getBars(symbol: $symbol, from: $from, to: $to, resolution: $resolution, removeLeadingNullValues: true) {
      t
      c
    }
  }
`;

export async function fetchBarsCodex(
  tokenAddress: string,
  from: number,
  to: number,
  resolution: string,
): Promise<PricePoint[]> {
  const symbol = `${tokenAddress}:${SOLANA_NETWORK_ID}`;
  const data = await gql<{ getBars: { t: number[]; c: (number | null)[] } }>(BARS_QUERY, {
    symbol,
    from,
    to,
    resolution,
  });
  const { t = [], c = [] } = data.getBars ?? {};
  const points: PricePoint[] = [];
  for (let i = 0; i < t.length; i++) {
    if (c[i] != null) points.push({ unixTime: t[i], value: c[i] as number });
  }
  return points;
}
