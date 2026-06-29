import { useQuery } from '@tanstack/react-query';
import { fetchTrendingTokens } from '@/api/birdeye';
import { fetchTrendingTokensCodex } from '@/api/codex';
import { TrendingToken } from '@/api/types';

// Birdeye is the primary source; Codex is the GraphQL fallback if Birdeye
// errors (e.g. free-tier rate limit). Sparklines are attached lazily by the
// TokenRow component to keep the list payload light.
async function loadTrending(): Promise<TrendingToken[]> {
  try {
    const tokens = await fetchTrendingTokens(25);
    if (tokens.length > 0) return tokens;
    throw new Error('empty');
  } catch (err) {
    return fetchTrendingTokensCodex(25);
  }
}

export function useTrendingTokens() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: loadTrending,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}
