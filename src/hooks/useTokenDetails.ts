import { useQuery } from '@tanstack/react-query';
import { fetchPriceHistory, fetchTokenOverview, fetchTokenTrades } from '@/api/birdeye';
import { fetchBarsCodex } from '@/api/codex';
import { ChartRange, PricePoint } from '@/api/types';

export function useTokenOverview(address: string) {
  return useQuery({
    queryKey: ['token', address, 'overview'],
    queryFn: () => fetchTokenOverview(address),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}

const CODEX_RESOLUTION: Record<ChartRange, { resolution: string; seconds: number }> = {
  '1H': { resolution: '1', seconds: 60 * 60 },
  '1D': { resolution: '15', seconds: 60 * 60 * 24 },
  '1W': { resolution: '60', seconds: 60 * 60 * 24 * 7 },
  '1M': { resolution: '240', seconds: 60 * 60 * 24 * 30 },
};

async function loadChart(address: string, range: ChartRange): Promise<PricePoint[]> {
  try {
    const points = await fetchPriceHistory(address, range);
    if (points.length > 1) return points;
    throw new Error('empty');
  } catch {
    const { resolution, seconds } = CODEX_RESOLUTION[range];
    const to = Math.floor(Date.now() / 1000);
    return fetchBarsCodex(address, to - seconds, to, resolution);
  }
}

export function useTokenChart(address: string, range: ChartRange) {
  return useQuery({
    queryKey: ['token', address, 'chart', range],
    queryFn: () => loadChart(address, range),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useTokenTrades(address: string) {
  return useQuery({
    queryKey: ['token', address, 'trades'],
    queryFn: () => fetchTokenTrades(address, 30),
    enabled: !!address,
    refetchInterval: 20_000,
  });
}
