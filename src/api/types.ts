// Normalised domain types shared across screens, independent of which
// upstream API (Birdeye / Codex) supplied the data.

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  price: number;
  priceChange24h: number; // percent
  volume24h: number;
  marketCap?: number;
  liquidity?: number;
  rank?: number;
  sparkline?: number[]; // recent prices, oldest -> newest
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  price: number;
  priceChange24h: number;
  marketCap?: number;
  fdv?: number;
  liquidity?: number;
  volume24h: number;
  holders?: number;
  supply?: number;
  website?: string;
  twitter?: string;
}

export interface PricePoint {
  unixTime: number; // seconds
  value: number;
}

export type TradeSide = 'buy' | 'sell';

export interface TokenTrade {
  txHash: string;
  side: TradeSide;
  owner: string;
  priceUsd: number;
  volumeUsd: number;
  tokenAmount: number;
  unixTime: number; // seconds
}

export type ChartRange = '1H' | '1D' | '1W' | '1M';
