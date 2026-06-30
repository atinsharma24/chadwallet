import { useQuery } from '@tanstack/react-query';
import { fetchActivity, fetchPortfolio } from '@/api/portfolio';

export function usePortfolio(owner?: string) {
  return useQuery({
    queryKey: ['portfolio', owner],
    queryFn: () => fetchPortfolio(owner as string),
    enabled: !!owner,
    refetchInterval: 30_000,
  });
}

export function useActivity(owner?: string) {
  return useQuery({
    queryKey: ['activity', owner],
    queryFn: () => fetchActivity(owner as string, 25),
    enabled: !!owner,
    refetchInterval: 45_000,
  });
}
