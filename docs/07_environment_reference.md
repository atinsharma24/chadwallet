# Environment Reference

All variables are declared in `.env.example` and read in `src/config/env.ts`. All use the `EXPO_PUBLIC_` prefix, which causes Expo to statically inline them into the JS bundle at build time. They are **not** secret at runtime — anything with this prefix is visible in the compiled app. Secrets (Birdeye and Codex API keys for production) should be stored in the Cloudflare Worker, not here.

When a required variable is missing, `src/config/env.ts::required()` logs a warning to the console and returns an empty string. The app continues to start; individual features degrade rather than the whole app crashing.

---

## Variable table

| Variable | `env.ts` field | Required? | Source | What degrades if missing |
|----------|---------------|-----------|--------|--------------------------|
| `EXPO_PUBLIC_PRIVY_APP_ID` | `privyAppId` | Yes | Privy dashboard → App settings | Auth does not work. `PrivyProvider` fails to initialize, sign-in screen renders but all login attempts fail. |
| `EXPO_PUBLIC_PRIVY_CLIENT_ID` | `privyClientId` | Recommended | Privy dashboard → App settings | Falls back to empty string. App may work in development; Privy recommends a client ID for native apps to enable passkeys and other native features. |
| `EXPO_PUBLIC_SOLANA_NETWORK` | `network` / `isMainnet` | No | Set manually | Defaults to `'devnet'`. If set to `'mainnet'`, the Alchemy RPC, swap gating, and Solscan URLs switch to mainnet. |
| `EXPO_PUBLIC_ALCHEMY_DEVNET_KEY` | `alchemyDevnetKey` | For devnet | Alchemy dashboard | `rpcEndpoint()` falls back to Solana's public `clusterApiUrl('devnet')`. Portfolio and activity still load but may be slower or rate-limited. |
| `EXPO_PUBLIC_ALCHEMY_MAINNET_KEY` | `alchemyMainnetKey` | For mainnet | Alchemy dashboard | `rpcEndpoint()` falls back to `clusterApiUrl('mainnet-beta')`. Portfolio loads but public RPC is heavily rate-limited in practice. |
| `EXPO_PUBLIC_API_PROXY_URL` | `apiProxyUrl` | For production | Cloudflare Worker deploy URL | `marketFetch` switches to direct API calls. If neither `DEV_BIRDEYE_KEY` nor `DEV_CODEX_KEY` is set, Birdeye and Codex requests are sent without API keys and will be rejected. See fallback chain below. |
| `EXPO_PUBLIC_DEV_BIRDEYE_KEY` | `devBirdeyeKey` | For local dev | Birdeye developer dashboard | `marketFetch` sends Birdeye requests without `X-API-KEY`. Birdeye returns 401. Falls through to Codex fallback (see below). |
| `EXPO_PUBLIC_DEV_CODEX_KEY` | `devCodexKey` | For local dev | Codex developer dashboard | `marketFetch` sends Codex requests without `Authorization`. Codex returns 401. |

---

## Birdeye → Codex fallback chain (when keys are missing)

This traces what happens specifically on the Trending screen when Birdeye fails.

**With proxy URL set and Worker secrets configured (production):**

```
TrendingScreen → useTrendingTokens → loadTrending
  → fetchTrendingTokens (Birdeye via Worker)
  → Worker adds BIRDEYE_API_KEY → 200 OK → tokens displayed
```

**With DEV_BIRDEYE_KEY set (local dev, no proxy):**

```
TrendingScreen → useTrendingTokens → loadTrending
  → fetchTrendingTokens (Birdeye direct with X-API-KEY header)
  → 200 OK → tokens displayed
```

**No BIRDEYE_KEY and no proxy URL (misconfigured):**

```
TrendingScreen → useTrendingTokens → loadTrending
  → fetchTrendingTokens (Birdeye direct, no key) → 401 → throws ApiError
  → catch block → fetchTrendingTokensCodex(25)
    → DEV_CODEX_KEY set? → Codex direct with Authorization header → tokens displayed
    → DEV_CODEX_KEY absent? → Codex direct, no key → 401 → throws
      → loadTrending throws → TanStack Query marks query as error
        → TrendingScreen shows ErrorState ("Something went wrong")
```

The app never shows fake data — if both providers fail, the user sees an error state with a retry button.

**Chart and trades (TokenDetailsScreen)** follow the same Birdeye → Codex pattern for chart data. For trades, there is no Codex fallback; a failed Birdeye call for trades leaves the trades section empty (no error state is shown for trades specifically — the section simply has no rows).

**Portfolio (PortfolioScreen):** Portfolio data comes from Alchemy RPC (not Birdeye/Codex) for balances, plus one Birdeye `fetchMultiPrice` call for USD pricing. If Alchemy is missing, portfolio shows nothing. If Birdeye multi-price fails, all holdings show `$0.00` value (the catch in `portfolio.ts:53` returns an empty price map).
