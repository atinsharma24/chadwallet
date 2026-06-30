# Decision Log

Entries for non-obvious choices already present in the code. Each entry states the decision, what it solves, the alternative that was not chosen, and the tradeoff accepted.

Where the rationale comes from an explicit code comment, that is noted. Where it is inferred from the implementation, that is also noted.

---

## 1. Route Birdeye and Codex through a Cloudflare Worker instead of calling them from the device

**Decision:** Market data requests for Birdeye and Codex go through a Cloudflare Worker (`cloudflare/worker.js`) that holds the API keys in Worker Secrets and injects them per request. The mobile app never has the keys.

**What it solves:** Birdeye and Codex require secret API keys in HTTP headers. Bundling them in a React Native app exposes them to anyone who extracts the JS bundle. Worker Secrets are stored server-side and are not visible in the Worker source code or in the app.

**Alternative:** Embed the keys in the app bundle, or require users to supply their own keys.

**Tradeoff accepted:** An additional deployment step and runtime dependency. If the Worker is down or misconfigured, all market data fails. Local dev requires either a Worker deployment or fallback dev keys in `.env` (which embed keys in the local build, which is acceptable for development but not for shipping). The dual path (`marketFetch` branches on `ENV.apiProxyUrl`) handles both cases.

**Source:** Explicit comment in `cloudflare/worker.js` line 3–4 and `src/config/env.ts` line 27.

---

## 2. Use Birdeye as primary with Codex as a GraphQL fallback, rather than a single provider

**Decision:** `useTrendingTokens` and `useTokenChart` both try Birdeye first. If Birdeye returns an empty result or throws, they call the equivalent Codex query. See `src/hooks/useTrendingTokens.ts::loadTrending` and `src/hooks/useTokenDetails.ts::loadChart`.

**What it solves:** Birdeye's free tier has rate limits. A single provider creates a single point of failure for market data display. Codex provides the same data via GraphQL at a different rate-limit ceiling.

**Alternative:** Use only one provider; retry on rate-limit with exponential backoff.

**Tradeoff accepted:** Two provider integrations to maintain, and the app now has two different data shapes to normalize (`TrendingToken` is the shared type; Codex's `change24` decimal ratio vs Birdeye's percentage requires an explicit conversion at `src/api/codex.ts:79`). The fallback is silent — users see data without knowing which provider served it.

**Source:** Comment in `src/api/codex.ts` line 7–8 ("used as a fallback source for trending tokens and OHLCV bars when Birdeye is rate-limited") and comment in `src/hooks/useTrendingTokens.ts` line 7–8.

---

## 3. TanStack Query manages all server state (no separate global store)

**Decision:** All remote data (market data, portfolio, activity) is managed by TanStack Query hooks in `src/hooks/`. There is no in-memory global store; screen-local UI state uses React `useState`, and net-worth history uses `AsyncStorage`.

**What it solves:** TanStack Query provides caching, background refetch, deduplication, and loading/error states without writing any of that machinery manually.

**Alternative:** Add a client-side store library (e.g. zustand) instead of or alongside TanStack Query.

**Tradeoff accepted:** Remote data and local UI state are handled by different mechanisms (TanStack Query cache vs. React `useState`). This is conventional but means there is no single unified state tree.

**Note:** `zustand` was previously declared in `package.json` but imported nowhere; it was removed so the dependency list reflects what the app actually uses. The `text-encoding` polyfill and Privy's required peer dependencies (`viem`, `permissionless`, `react-native-passkeys`, `react-native-qrcode-styled`, `react-native-webview`, `expo-apple-authentication`) remain because Privy needs them even on a Solana-only app.

**Source:** Implementation — no `import ... from 'zustand'` exists anywhere under `src/`.

---

## 4. Privy embedded wallet instead of a "connect your own wallet" flow

**Decision:** The app creates a Privy embedded wallet automatically for every new user (`createOnLogin: 'users-without-wallets'` in `src/lib/privy.tsx:17`). Users do not import a seed phrase or connect Phantom, Solflare, or another external wallet.

**What it solves:** Onboarding friction. A new user can sign in with email or Google and immediately have a funded Solana wallet (via the devnet airdrop) without installing a separate wallet app or understanding seed phrases.

**Alternative:** Use `@solana/wallet-adapter` or a similar library to let users connect their own wallet.

**Tradeoff accepted:** Users cannot use their existing wallets or assets. The embedded wallet's private key is managed by Privy; if Privy's service changes pricing or terms, that affects all users. Users who already have significant Solana holdings would need to transfer funds to the new embedded wallet address to use this app.

**Source:** Explicit comment in `src/lib/privy.tsx` lines 7–9 and `createOnLogin` config value at line 18.

---

## 5. Net-worth history from local AsyncStorage snapshots instead of a backend service

**Decision:** `useNetWorthHistory` (`src/hooks/useNetWorthHistory.ts`) records one `{ unixTime, totalUsd }` snapshot per day in `AsyncStorage`, keyed by `networth:{network}:{owner}`. The chart in `PortfolioScreen` is built from these snapshots. Snapshots are kept for 90 days.

**What it solves:** No Solana API (including Alchemy) provides a user's historical portfolio value. Computing it server-side would require storing a snapshot of every user's holdings and prices over time, which is a significant backend engineering effort. The local snapshot approach gives a real curve derived from the user's actual balance at time of access with zero backend cost.

**Alternative:** Build or use a backend service that records portfolio snapshots on a schedule; or approximate historical value from on-chain transaction history.

**Tradeoff accepted:** The chart only has data points for days when the user opened the Portfolio screen. A new user sees no chart (or a single-point chart that `PriceChart` renders as an empty surface). The data is device-local — reinstalling the app or signing in on a different device loses the history. The network is part of the key, so devnet and mainnet history are stored separately.

**Source:** Comment in `src/hooks/useNetWorthHistory.ts` lines 7–9 ("We can't fetch a user's historical net worth from any single API, so we build it honestly from real balance snapshots").

---

## 6. React Navigation native stack instead of another navigation library

**Decision:** Navigation uses `@react-navigation/native-stack` and `@react-navigation/bottom-tabs`.

**What it solves:** React Navigation is the standard navigation library for Expo and React Native apps. Native stack uses UINavigationController on iOS and FragmentManager on Android, giving platform-native transition animations and gesture handling.

**Alternative:** Expo Router (file-based routing), React Native Navigation (Wix), or a custom navigator.

**Tradeoff accepted:** React Navigation adds `react-native-screens` and `react-native-safe-area-context` as required native dependencies (both already present). Expo Router was not chosen, likely because file-based routing adds complexity for a project of this size and the navigation structure is simple enough to declare explicitly.

**Source:** Inferred from the implementation. No comment in the code explains this choice.
