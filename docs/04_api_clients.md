# API Clients

All files are in `src/api/`.

---

## `http.ts` — transport layer

### `ApiError`

```ts
class ApiError extends Error {
  constructor(public status: number, message: string)
}
```

Thrown by both `marketFetch` and `jsonFetch` when the response status is not `ok`. `status` carries the HTTP status code; `message` includes the service name, status code, and up to 200 characters of the response body.

---

### `marketFetch<T>(service, path, init?): Promise<T>`

Routes Birdeye and Codex requests either through the Cloudflare Worker or directly to the upstream API. This function is the single point that enforces the key-hiding security model.

**Parameters:**

| Param | Type | Notes |
|-------|------|-------|
| `service` | `'birdeye' \| 'codex'` | Selects the upstream base URL and which dev key to use |
| `path` | `string` | Path + query string, e.g. `/defi/token_trending?limit=20` |
| `init` | `RequestInit` | Optional fetch options (method, body, headers) |

**Branching logic (lines 33–44):**

1. If `ENV.apiProxyUrl` is non-empty: construct URL as `{proxyUrl}/{service}{path}`. Send no API key headers — the worker injects them. Trailing slashes on `apiProxyUrl` are stripped at parse time in `src/config/env.ts`.

2. If `ENV.apiProxyUrl` is empty: construct URL as `{DIRECT_BASE[service]}{path}`. Then:
   - For `birdeye`: add `x-chain: solana` and, if `ENV.devBirdeyeKey` is set, `X-API-KEY: {devBirdeyeKey}`.
   - For `codex`: if `ENV.devCodexKey` is set, add `Authorization: {devCodexKey}`.
   - If neither dev key is set for a service, the request is sent without an API key and will likely receive a 401 or rate-limited response.

Returns the parsed JSON body as `T`. Throws `ApiError` on non-`ok` responses.

---

### `jsonFetch<T>(url, init?): Promise<T>`

Plain fetch wrapper with no routing logic. Used exclusively by `src/api/jupiter.ts` for direct calls to the Jupiter API. Throws `ApiError` on non-`ok` responses. No API key headers are added.

---

## `birdeye.ts` — Birdeye REST client

All functions call `marketFetch` with `service = 'birdeye'`. The Birdeye API wraps all responses in `{ success: boolean, data: T }`.

### `fetchTrendingTokens(limit = 20): Promise<TrendingToken[]>`

Endpoint: `GET /defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit={limit}`

Returns an array of `TrendingToken`. In practice the hook calls this with `limit = 25`. If `res.data?.tokens` is absent or empty, returns `[]`. Fields that can be missing from the Birdeye response and fall back to `0` or `undefined`: `price24hChangePercent`, `volume24hUSD`, `marketcap`, `liquidity`, `rank`.

### `fetchTokenOverview(address: string): Promise<TokenOverview>`

Endpoint: `GET /defi/token_overview?address={address}`

Returns a `TokenOverview`. Fields that can be absent and fall back: `priceChange24hPercent` → `0`, `liquidity` → `undefined`, `v24hUSD` → `0`, `mc` / `fdv` / `holder` / `supply` → `undefined`. `extensions.website` and `extensions.twitter` are optional and mapped to `website` / `twitter`.

### `fetchPriceHistory(address: string, range: ChartRange): Promise<PricePoint[]>`

Endpoint: `GET /defi/history_price?address={address}&address_type=token&type={type}&time_from={from}&time_to={now}`

Range-to-resolution mapping (defined in `RANGE_CONFIG`):

| Range | Bar interval | Lookback |
|-------|-------------|---------|
| `1H` | `1m` | 3,600 s |
| `1D` | `15m` | 86,400 s |
| `1W` | `1H` | 604,800 s |
| `1M` | `4H` | 2,592,000 s |

Returns `res.data?.items ?? []`. An empty array or a network error both trigger the Codex fallback in `useTokenChart` (see [Data Layer](03_data_layer.md)).

### `fetchTokenTrades(address: string, limit = 25): Promise<TokenTrade[]>`

Endpoint: `GET /defi/txs/token?address={address}&tx_type=swap&sort_type=desc&offset=0&limit={limit}`

Called with `limit = 30` from `useTokenTrades`. Returns `TokenTrade[]`. Fields that can be zero: `volumeUSD`, `to.uiAmount`, `to.price`, `from.uiAmount`, `from.price`. The `priceUsd` field on the result prefers `to.price`, then `from.price`, then `0`. The `tokenAmount` field prefers `to.uiAmount`, then `from.uiAmount`, then `0`.

### `fetchMultiPrice(addresses: string[]): Promise<Record<string, number>>`

Endpoint: `GET /defi/multi_price?list_address={comma-joined-addresses}`

Returns a map of mint address → USD price. Called from `src/api/portfolio.ts` with the SOL mint plus all SPL token mints in the user's wallet. If `addresses` is empty, returns `{}` immediately without a network call. Missing prices default to `0`. The entire call is wrapped in `.catch(() => ({}))` by the caller (`portfolio.ts:53`), so a Birdeye failure results in all prices being `0` rather than a thrown error.

---

## `codex.ts` — Codex GraphQL client

All functions call `marketFetch` with `service = 'codex'`, posting to `/graphql`. The internal `gql<T>` helper throws if `res.errors` is non-empty.

Solana network ID on Codex: `1399811149` (exported as `SOLANA_NETWORK_ID`).

### `fetchTrendingTokensCodex(limit = 20): Promise<TrendingToken[]>`

GraphQL operation: `filterTokens` sorted by `volume24` descending.

Codex `change24` is a decimal ratio (e.g. `0.12` = +12%). The mapping code multiplies by 100 to produce a percentage consistent with the Birdeye representation (`priceChange24h`). This conversion is in `src/api/codex.ts:79`.

Fields that can be missing: `imageThumbUrl` → `undefined`, `decimals` → `9`, `priceUSD` → `0`, all numeric fields are string-typed in the GraphQL response and converted with `Number()`.

### `fetchBarsCodex(tokenAddress, from, to, resolution): Promise<PricePoint[]>`

GraphQL operation: `getBars`. The `symbol` argument is constructed as `{tokenAddress}:{SOLANA_NETWORK_ID}`.

`resolution` values passed from `useTokenChart`:

| Range | Resolution |
|-------|-----------|
| `1H` | `'1'` (1-minute bars) |
| `1D` | `'15'` (15-minute bars) |
| `1W` | `'60'` (1-hour bars) |
| `1M` | `'240'` (4-hour bars) |

The response has parallel arrays `t` (unix timestamps) and `c` (close prices). Null close values are filtered out; only pairs where `c[i] != null` produce a `PricePoint`.

---

## `jupiter.ts` — Jupiter Aggregator v6 client

Both functions call `jsonFetch` directly to `https://quote-api.jup.ag/v6`. No API key is required.

### `getJupiterQuote(params): Promise<JupiterQuote>`

Endpoint: `GET /quote?inputMint=...&outputMint=...&amount=...&slippageBps=...&swapMode=ExactIn`

**Parameters:**

| Param | Type | Notes |
|-------|------|-------|
| `inputMint` | `string` | Source token mint address |
| `outputMint` | `string` | Destination token mint address |
| `amount` | `string \| number` | Amount in base units (lamports for SOL, raw token units for SPL) |
| `slippageBps` | `number` | Defaults to `100` (1%) if not supplied |

Returns `JupiterQuote`. The quote object is opaque — its full shape is passed as-is to `getJupiterSwapTransaction`. Callers should not rely on individual fields other than `outAmount`, `priceImpactPct`, `slippageBps`, and `routePlan`.

### `getJupiterSwapTransaction(params): Promise<JupiterSwapResponse>`

Endpoint: `POST /swap`

**Parameters:**

| Param | Type | Notes |
|-------|------|-------|
| `quoteResponse` | `JupiterQuote` | Full quote object returned by `getJupiterQuote` |
| `userPublicKey` | `string` | The wallet's public key (Solana base58 address) |
| `wrapAndUnwrapSol` | `boolean` | Defaults to `true` — Jupiter wraps SOL to wSOL and unwraps the output automatically |

Additional options sent in the POST body (not configurable by callers): `dynamicComputeUnitLimit: true`, `prioritizationFeeLamports: 'auto'`. These let Jupiter set compute unit limits and priority fees automatically rather than the caller estimating them.

Returns `JupiterSwapResponse` with `swapTransaction` (base64-encoded `VersionedTransaction`) and `lastValidBlockHeight`.

---

## `portfolio.ts` — on-chain portfolio data

Uses `@solana/web3.js` via `getConnection()` from `src/lib/solana.ts` and `fetchMultiPrice` from `src/api/birdeye.ts`.

### `fetchPortfolio(owner: string): Promise<Portfolio>`

Makes two parallel RPC calls:
1. `connection.getBalance(ownerKey)` — native SOL balance in lamports, divided by `LAMPORTS_PER_SOL` to get UI amount.
2. `connection.getParsedTokenAccountsByOwner(ownerKey, { programId: TOKEN_PROGRAM_ID })` — all SPL token accounts for the owner.

Token accounts with `amount === 0` (or falsy `uiAmount`) are filtered out.

Prices are fetched in a single batched call: `fetchMultiPrice([SOL_MINT, ...tokenMints])`. If `fetchMultiPrice` throws, the catch returns `{}` (empty object) and all holdings are valued at `$0`.

Holdings are sorted by `valueUsd` descending. SOL is always included as the first entry before sorting.

**Fields that can be zero:** `priceUsd` and `valueUsd` on any holding if the Birdeye price call fails or if Birdeye doesn't have a price for that mint.

### `fetchActivity(owner: string, limit = 20): Promise<ActivityItem[]>`

Endpoint: `connection.getSignaturesForAddress(ownerKey, { limit })`. Called with `limit = 25` from `useActivity`.

`blockTime` is `null` if the RPC doesn't have block time data for that slot (this is a known gap in some RPC providers). `err` is `true` if `s.err != null` (any non-null error value on the signature info).

### `requestDevnetAirdrop(owner: string): Promise<string>`

Calls `connection.requestAirdrop(ownerKey, LAMPORTS_PER_SOL)` (1 SOL) and waits for `confirmTransaction` with commitment `'confirmed'`. Returns the transaction signature. This call goes to whatever network `getConnection()` is configured for — on mainnet it will throw (airdrops are not available on mainnet-beta).
