# ChadWallet — Solana Memecoin Trading App

A production-minded React Native (Expo) app for discovering and trading Solana
memecoins, styled after **ChadWallet**. Sign in with email or Google (Privy
embedded wallet), browse live trending tokens, drill into charts & stats, swap
via Jupiter, and track your portfolio.

> **Status:** Devnet-first. Flip one env var to go Mainnet (see
> [Switching to Mainnet](#switching-to-mainnet)). The full JS bundle compiles
> cleanly (`npx expo export`), and the app is structured to build to an
> Appetize.io preview via EAS.

## Features

| Screen | What it does |
|--------|--------------|
| **Sign In** | Privy SDK — email OTP + Google OAuth, auto-creates an embedded Solana wallet |
| **Trending (Home)** | Live trending memecoins (Birdeye → Codex fallback), **pull-to-refresh**, per-row **sparklines** |
| **Token Details** | Live price chart (1H/1D/1W/1M), market cap / volume / liquidity / holders, recent trades, **in-app Jupiter swap** |
| **Portfolio** | Real holdings + USD valuation, SOL balance, tx history, **FAB → wallet address sheet**, **net-worth chart**, Devnet airdrop |

## Tech Stack

- **Framework:** React Native via **Expo (Dev Client)** + TypeScript
- **Auth & Wallet:** [Privy](https://privy.io) (`@privy-io/expo`) embedded Solana wallet
- **State / Data:** **Zustand**-style hooks + **TanStack Query** (caching, refetch, pull-to-refresh)
- **RPC:** **Alchemy** Solana (devnet/mainnet)
- **Market data:** **Birdeye** (REST) with **Codex.io** (GraphQL) fallback
- **Swaps:** **Jupiter** Aggregator v6
- **Key hiding:** **Cloudflare Worker** proxy for Birdeye/Codex secrets
- **Backup:** **Supabase** (optional auth/data backup)
- **Charts:** `react-native-svg` (no heavy native chart dep)

All services are used on their **free tiers**.

## Architecture

```
Privy (auth + embedded wallet)
        │
        ▼
  React Native UI ──► TanStack Query hooks ──► API clients
        │                                        │
        │                                        ├─► Birdeye / Codex  (via Cloudflare Worker proxy)
        │                                        ├─► Jupiter v6       (direct, mainnet swaps)
        │                                        └─► Alchemy RPC      (balances, tx, airdrop)
        ▼
  Supabase (optional backup)
```

Market-data requests go through `marketFetch()`, which routes to the Cloudflare
Worker when `EXPO_PUBLIC_API_PROXY_URL` is set (keeping Birdeye/Codex keys off the
device) and falls back to direct calls with dev keys for local development.

## Project Structure

```
chadwallet/
├── App.tsx                     # Providers: GestureHandler, SafeArea, Privy, Query, Navigation
├── index.js                    # Entry — imports polyfills first, registers App
├── app.json / eas.json         # Expo + EAS build config
├── metro.config.js             # web3 shims + package-exports resolution
├── babel.config.js             # reanimated + module-resolver (@/ alias)
├── .env.example                # All env vars documented
├── assets/                     # Icon / splash placeholders (replace with brand art)
├── cloudflare/                 # API proxy Worker (hides Birdeye/Codex keys)
│   ├── worker.js
│   └── wrangler.toml
└── src/
    ├── config/env.ts           # Typed env access, network flag, mints
    ├── theme/                  # Colors, spacing, typography, formatters
    ├── lib/                    # polyfills, solana connection, privy, query, supabase
    ├── api/                    # birdeye, codex, jupiter, portfolio, http, types
    ├── hooks/                  # useTrendingTokens, useTokenDetails, usePortfolio,
    │                           #   useWallet, useSwap, useSparkline, useNetWorthHistory
    ├── components/             # Screen, Button, TokenRow, Sparkline, PriceChart,
    │                           #   SwapPanel, StatCard, TokenLogo, States, PercentBadge
    ├── navigation/             # RootNavigator (auth gate), AppTabs, types
    └── screens/                # SignIn, Trending, TokenDetails, Portfolio
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#   → fill in Privy App ID, Alchemy keys, and either a dev Birdeye key
#     or the Cloudflare proxy URL (see SETUP.md)

# 3. Typecheck (optional)
npm run typecheck

# 4. Run with a dev client
#    (Expo Go won't work — native modules require a dev build)
npm run start
```

Because the app uses native modules (Privy, Solana crypto), you need a **dev
client build**, not Expo Go:

```bash
npx expo run:android      # local Android build
npx expo run:ios          # local iOS build (macOS)
# or build in the cloud:
eas build --profile development --platform android
```

See **[SETUP.md](./SETUP.md)** for full credential setup, the Cloudflare proxy
deploy, the Devnet→Mainnet switch, and **building the Appetize.io preview**.

## Switching to Mainnet

1. Set `EXPO_PUBLIC_SOLANA_NETWORK=mainnet` in `.env`.
2. Ensure `EXPO_PUBLIC_ALCHEMY_MAINNET_KEY` is set.
3. Rebuild. Trending/portfolio/swaps now use mainnet. (Jupiter swaps are
   **mainnet-only** — on devnet the swap panel shows a preview state.)

## Notes & Honest Limitations

- **Real data only** — no mock data. If a key is missing, that screen degrades
  gracefully (and logs a warning) rather than showing fakes.
- **Net-worth chart** is built from real balance snapshots persisted locally
  (one point/day); it fills in over time as you use the app.
- **Codex.io:** sign up with a card but **do not send the $1 USDC payment** — the
  free tier is sufficient.
- Brand colors/logos are tasteful placeholders; drop the official assets in
  `assets/` and tweak `src/theme/index.ts` to match exactly.
