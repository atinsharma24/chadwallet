// Shared formatting helpers for prices, market caps and percentages.

export function formatUsd(value?: number | null, opts?: { compact?: boolean }): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  if (opts?.compact) return `$${compactNumber(value)}`;
  if (value !== 0 && Math.abs(value) < 0.01) {
    // Sub-penny memecoin prices: show significant digits.
    return `$${value.toPrecision(4)}`;
  }
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  })}`;
}

export function compactNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '▲ ' : value < 0 ? '▼ ' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function formatTokenAmount(value?: number | null, maxFrac = 4): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: maxFrac });
}

export function timeAgo(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
