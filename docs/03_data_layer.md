# Data Layer

## Global TanStack Query defaults (`src/lib/queryClient.ts`)

```ts
{
  staleTime: 30_000,       // 30 seconds — data is considered fresh for this long
  gcTime: 5 * 60_000,      // 5 minutes — inactive queries are garbage-collected after this
  retry: 2,                // failed requests are retried up to 2 times
  refetchOnWindowFocus: false  // no automatic refetch on app foreground
}
```

`refetchOnWindowFocus: false` matters in a mobile context because React Native's window focus events are less predictable than a browser's; relying on explicit `refetchInterval` values gives more consistent behaviour.

Any hook that does not specify its own `staleTime` inherits `30_000` from these defaults.

---

## Hook-by-hook reference

### `useTrendingTokens` (`src/hooks/useTrendingTokens.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['trending']` |
| `staleTime` | 20,000 ms (20 seconds) |
| `refetchInterval` | 60,000 ms (60 seconds) |
| `retry` | 2 (inherited) |

The `staleTime` of 20 seconds is shorter than the 30-second global default, so a user switching away and returning within 20 seconds sees cached data without a network call; after 20 seconds TanStack Query will refetch on next render. The background refetch runs every 60 seconds regardless of focus state.

**Birdeye primary / Codex fallback — `loadTrending` function:**

```
1. Call fetchTrendingTokens(25) via Birdeye.
2. If result array length > 0, return it.
3. If result array is empty OR if the call throws, call fetchTrendingTokensCodex(25) via Codex.
```

An empty array from Birdeye is deliberately treated as an error by the code (`throw new Error('empty')`). The catch block then calls the Codex fallback. This means the fallback runs on three conditions: a network error, an API error response, or a successful response with zero tokens.

---

### `useTokenOverview` (`src/hooks/useTokenDetails.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['token', address, 'overview']` |
| `staleTime` | 30,000 ms (global default — not overridden) |
| `refetchInterval` | 30,000 ms |
| `enabled` | `!!address` |

Refetches every 30 seconds so the price and stats on `TokenDetailsScreen` stay reasonably current while a user is looking at the page. No Codex fallback — if Birdeye fails, the screen falls back to the `seedPrice` / `seedChange` values passed as navigation params (see [Screens and Navigation](06_screens_and_navigation.md)).

---

### `useTokenChart` (`src/hooks/useTokenDetails.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['token', address, 'chart', range]` |
| `staleTime` | 30,000 ms |
| `refetchInterval` | none |
| `enabled` | `!!address` |

Chart data does not automatically refresh; `staleTime` of 30 seconds means a fresh fetch is triggered only if the user leaves and returns to the screen after 30 seconds, or switches the range selector (which changes the query key).

**Birdeye primary / Codex fallback — `loadChart` function:**

```
1. Call fetchPriceHistory(address, range) via Birdeye.
2. If result array length > 1, return it.   ← NOTE: threshold is > 1, not > 0
3. If length ≤ 1 OR call throws, call fetchBarsCodex(address, ...) via Codex.
```

The threshold here (`> 1`) differs from the trending fallback (`> 0`). A single price point is not enough to draw a line, so it is treated as insufficient and falls through to Codex. As with trending, both a thrown error and an insufficient result trigger the fallback.

---

### `useTokenTrades` (`src/hooks/useTokenDetails.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['token', address, 'trades']` |
| `staleTime` | 30,000 ms (global default) |
| `refetchInterval` | 20,000 ms |
| `enabled` | `!!address` |

Trades poll every 20 seconds — the shortest interval in the app. A new trade can appear within seconds on a busy token, so the tighter cadence makes sense here. There is no Codex fallback; if Birdeye fails, `TokenDetailsScreen` shows the trades section with whatever was last cached or nothing.

---

### `usePortfolio` (`src/hooks/usePortfolio.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['portfolio', owner]` |
| `staleTime` | 30,000 ms (global default) |
| `refetchInterval` | 30,000 ms |
| `enabled` | `!!owner` |

Polls every 30 seconds so the holding values stay current without hammering the Alchemy RPC. The `owner` param is the wallet address; the query is disabled until that address is known (i.e., until Privy has loaded and the wallet exists).

---

### `useActivity` (`src/hooks/usePortfolio.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['activity', owner]` |
| `staleTime` | 30,000 ms (global default) |
| `refetchInterval` | 45,000 ms |
| `enabled` | `!!owner` |

Transaction history polls every 45 seconds. Activity changes less frequently than prices, so a longer interval reduces Alchemy RPC calls without meaningfully degrading the user experience.

---

### `useSparkline` (`src/hooks/useSparkline.ts`)

| Setting | Value |
|---------|-------|
| Query key | `['sparkline', address]` |
| `staleTime` | 300,000 ms (5 minutes) |
| `refetchInterval` | none |
| `retry` | 0 |
| `enabled` | `enabled && !!address` |

**Why a separate query per row instead of bundling into the trending list response:**

The Birdeye trending list endpoint (`/defi/token_trending`) does not return sparkline data. Fetching sparklines as part of the list would require N+1 calls at list load time, which would block the list from painting while 25 individual history requests completed. Instead, sparklines are fetched lazily — each `TokenRow` calls `useSparkline` with its own address. TanStack Query deduplicates parallel queries with the same key, but here each address is distinct, so 25 separate requests go out in parallel after the list renders.

**`retry: 0`** prevents TanStack Query from retrying failed sparkline fetches. Sparklines are optional visual decoration; if Birdeye rejects a request (e.g., because the free-tier rate limit is hit across 25 concurrent calls), failing silently is preferable to hammering the API with retries and potentially triggering a longer block. The list row renders without a sparkline if the fetch fails.

The `enabled` prop checks `showSparkline && !token.sparkline` in `TokenRow` (`src/components/TokenRow.tsx:20`). If the trending list payload already included a `sparkline` array on the token object, the hook is skipped for that row. In the current implementation, the Birdeye trending endpoint does not return sparkline data, so `token.sparkline` is always `undefined` and `useSparkline` always fires.

**`staleTime: 5 minutes`** means a sparkline fetched during a session is reused for up to 5 minutes without refetching, reducing calls when the user scrolls up and down the list.

---

## Net-worth history: not TanStack Query (`src/hooks/useNetWorthHistory.ts`)

`useNetWorthHistory` does not use TanStack Query. It uses React's own `useState` and `useEffect` to read from and write to `AsyncStorage`. This is appropriate because the data source is local device storage, not a network request. There is no deduplication or caching concern, and the data is append-only (one snapshot per day, keyed by `networth:{network}:{owner}`).

The hook returns a `PricePoint[]` array that grows by one entry per day the portfolio screen loads with a non-null total. It keeps the last 90 snapshots. The chart on `PortfolioScreen` renders only when `series.length > 1` (enforced in the screen, not the hook).
