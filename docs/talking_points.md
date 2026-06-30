# Talking Points — Review Call Cheat Sheet

## One-sentence architecture summary

A React Native (Expo) app that signs users in with Privy (email OTP or Google OAuth), auto-creates an embedded Solana wallet, shows live trending memecoin data from Birdeye with Codex as a fallback (both proxied through a Cloudflare Worker to hide API keys), lets users swap SOL for tokens via Jupiter on mainnet, and tracks portfolio value using Alchemy RPC for balances and Birdeye for pricing.

---

## Three most interesting engineering decisions

**1. Cloudflare Worker as an API key proxy**

Birdeye and Codex both require secret API keys. Rather than embedding them in the app bundle (where they are extractable), the app routes all market data through a Cloudflare Worker that holds the keys as Worker Secrets. The mobile app's `marketFetch()` function in `src/api/http.ts` switches between the proxy URL and direct API calls based on a single env var (`EXPO_PUBLIC_API_PROXY_URL`), so the same code works in local dev (direct calls with a `.env` key) and production (through the Worker with no key in the bundle). This is interesting because it's a simple, cheap pattern that solves a real mobile security problem without any backend infrastructure.

*Likely follow-up: "What happens if the Cloudflare Worker is down?"*
All Birdeye and Codex calls fail. `useTrendingTokens` throws after the Codex fallback also fails, and `TrendingScreen` shows an error state with a retry button. `TokenDetailsScreen` shows a loading spinner indefinitely for chart data. Portfolio data (from Alchemy RPC directly) is unaffected. There is no circuit breaker or local cache that survives Worker downtime beyond TanStack Query's `gcTime` window (5 minutes of cached data).

---

**2. Birdeye primary / Codex GraphQL fallback with deliberate empty-result handling**

Rather than retrying the same provider on failure, the app switches providers. Both `useTrendingTokens` and `useTokenChart` treat an empty response the same as a thrown error — if Birdeye returns zero tokens or fewer than 2 chart points, the code deliberately throws `new Error('empty')` to trigger the catch block and call Codex. This is interesting because most fallback patterns only catch thrown errors; this one also catches a "successful but useless" response, which is the more common failure mode for a free-tier API (rate limit responses sometimes return an empty data envelope rather than a 429).

*Likely follow-up: "Why not just always use both providers and merge the results?"*
Birdeye and Codex don't have a way to merge ranking data cleanly — Birdeye ranks by its own algorithm, Codex by 24h volume. Merging would produce a list with inconsistent ordering. The fallback pattern keeps the list consistent: it's always one provider's view, never a blend. For charts, the data is close enough that a Codex bar can substitute for a Birdeye OHLCV point without the user noticing.

---

**3. Net-worth history from local AsyncStorage snapshots**

There is no API that returns a user's historical Solana portfolio value. Rather than either omitting the chart or building a backend service that snapshots every user's holdings daily, the app records the current portfolio total to AsyncStorage once per day, keyed by wallet address and network. Over time this builds a genuine net-worth curve from the user's own actual balance history. This is interesting because it's an honest solution to a data availability problem that avoids any backend cost, with a clearly stated limitation: the chart only exists from the day the user first opened the Portfolio screen, and is device-local.

*Likely follow-up: "What happens if the user reinstalls the app?"*
AsyncStorage is cleared on reinstall. The net-worth history is lost. The chart starts from zero again and fills in over subsequent days. This is a known limitation stated in the README. A backend snapshot service would solve it, but that's out of scope for the current implementation.

---

## Two honest limitations to raise proactively

**1. Zustand is a declared dependency but is completely unused.**
`package.json` lists `zustand ^4.5.4` as a dependency. No file under `src/` imports it. The README describes "Zustand-style hooks" which further implies it's in use. It isn't. This should be removed before the next release — an unused dependency adds bundle size and creates confusion for future maintainers.

**2. There are no automated tests.**
The only verification is a five-item manual checklist in `SETUP.md`. The pure formatting functions in `src/theme/format.ts` have no tests despite having several edge-case branches (sub-penny values, compact notation, sign handling). The Birdeye→Codex fallback logic has no test that confirms an empty Birdeye response actually triggers the Codex call. Both would be low-cost to add.
