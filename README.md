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
- **Server state:** **TanStack Query** (caching, refetch, pull-to-refresh)
- **RPC:** **Alchemy** Solana (devnet/mainnet)
- **Market data:** **Birdeye** (REST) with **Codex.io** (GraphQL) fallback
- **Swaps:** **Jupiter** Aggregator v6
- **Key hiding:** **Cloudflare Worker** proxy for Birdeye/Codex secrets
- **Charts:** `react-native-svg` (no heavy native chart dep)

All services are used on their **free tiers**.

## Architecture and Project Structure

For full technical documentation, see **[docs/00_index.md](docs/00_index.md)**.

In brief: Privy handles auth and the embedded Solana wallet. TanStack Query hooks in `src/hooks/` fetch market data from Birdeye (primary) and Codex (fallback), both routed through a Cloudflare Worker that injects API keys so secrets never appear in the app bundle. Jupiter is called directly from the device for swap quotes and transactions (no key required). Portfolio balances come from Alchemy's Solana RPC. Net-worth history is stored locally in AsyncStorage.

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
