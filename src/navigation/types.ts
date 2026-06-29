import { TrendingToken } from '@/api/types';

export type RootStackParamList = {
  Tabs: undefined;
  TokenDetails: {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
    // Seed values so the details header renders instantly before the
    // overview query resolves.
    seedPrice?: number;
    seedChange?: number;
  };
};

export type TabParamList = {
  Trending: undefined;
  Portfolio: undefined;
};

export function toTokenDetailsParams(token: TrendingToken) {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    logoURI: token.logoURI,
    seedPrice: token.price,
    seedChange: token.priceChange24h,
  };
}
