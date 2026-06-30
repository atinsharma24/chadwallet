import { useQuery } from '@tanstack/react-query';
import { fetchPriceHistory } from '@/api/birdeye';

// Lightweight 1D sparkline series for trending rows. Cached aggressively and
// kept separate from the main list query so a slow/failed sparkline never
// blocks the list from rendering.
export function useSparkline(address: string, enabled = true) {
  return useQuery({
    queryKey: ['sparkline', address],
    queryFn: async () => {
      const points = await fetchPriceHistory(address, '1D');
      return points.map((p) => p.value);
    },
    enabled: enabled && !!address,
    staleTime: 5 * 60_000,
    retry: 0, // sparklines are best-effort; don't hammer the free tier
  });
}
