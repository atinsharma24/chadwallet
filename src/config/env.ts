// Centralised, typed access to environment variables.
// EXPO_PUBLIC_* vars are statically inlined by Expo at build time.

export type SolanaNetwork = 'devnet' | 'mainnet';

function required(value: string | undefined, name: string): string {
  if (!value) {
    // We warn instead of throwing so the app still boots in dev with partial
    // config; screens degrade gracefully and SETUP.md explains what to fill.
    console.warn(`[env] Missing ${name}. See .env.example / SETUP.md.`);
  }
  return value ?? '';
}

const network = (process.env.EXPO_PUBLIC_SOLANA_NETWORK ?? 'devnet') as SolanaNetwork;

export const ENV = {
  network,
  isMainnet: network === 'mainnet',

  privyAppId: required(process.env.EXPO_PUBLIC_PRIVY_APP_ID, 'EXPO_PUBLIC_PRIVY_APP_ID'),
  privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? '',

  alchemyDevnetKey: process.env.EXPO_PUBLIC_ALCHEMY_DEVNET_KEY ?? '',
  alchemyMainnetKey: process.env.EXPO_PUBLIC_ALCHEMY_MAINNET_KEY ?? '',

  // Cloudflare Worker that proxies Birdeye/Codex and injects secret keys.
  apiProxyUrl: (process.env.EXPO_PUBLIC_API_PROXY_URL ?? '').replace(/\/$/, ''),

  // DEV-ONLY direct keys. Used only when no proxy is configured so you can run
  // locally before deploying the Cloudflare Worker. In production, leave these
  // blank and route through EXPO_PUBLIC_API_PROXY_URL so keys never ship.
  devBirdeyeKey: process.env.EXPO_PUBLIC_DEV_BIRDEYE_KEY ?? '',
  devCodexKey: process.env.EXPO_PUBLIC_DEV_CODEX_KEY ?? '',
} as const;

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
