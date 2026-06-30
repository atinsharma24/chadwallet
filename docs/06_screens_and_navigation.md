# Screens and Navigation

## Navigation structure

```
RootNavigator (native stack, src/navigation/RootNavigator.tsx)
├── [unauthenticated] SignInScreen (rendered directly, not as a stack screen)
└── [authenticated]
    ├── "Tabs" → AppTabs (bottom tab navigator, src/navigation/AppTabs.tsx)
    │   ├── "Trending" → TrendingScreen
    │   └── "Portfolio" → PortfolioScreen
    └── "TokenDetails" → TokenDetailsScreen (pushed onto stack over tabs)
```

`RootNavigator` conditionally renders the authenticated stack or `SignInScreen` based on `isAuthenticated` from `useWallet`. While Privy is initializing (`isReady === false`), a full-screen `ActivityIndicator` is shown instead of either. See [Auth and Wallet](02_auth_and_wallet.md) for the auth gate logic.

`AppTabs` uses `createBottomTabNavigator`. Tab icons are emoji glyphs rendered as `Text` components (🔥 for Trending, 💼 for Portfolio). The tab bar height is fixed at 64 px with 10 px bottom padding.

---

## Type definitions (`src/navigation/types.ts`)

### `RootStackParamList`

| Route | Params |
|-------|--------|
| `Tabs` | `undefined` |
| `TokenDetails` | `{ address, symbol, name, logoURI?, seedPrice?, seedChange? }` |

### `TabParamList`

| Route | Params |
|-------|--------|
| `Trending` | `undefined` |
| `Portfolio` | `undefined` |

### `toTokenDetailsParams(token: TrendingToken)`

A helper that maps a `TrendingToken` to the `TokenDetails` route params. It copies `address`, `symbol`, `name`, `logoURI` directly, and also passes `price` as `seedPrice` and `priceChange24h` as `seedChange`.

**The `seedPrice` / `seedChange` pattern:**

When a user taps a token in `TrendingScreen`, the app navigates to `TokenDetailsScreen` and simultaneously fires the `useTokenOverview(address)` query. There is a latency window — typically 100–500 ms — before the overview query resolves. Without the seed values, the price display would show `—` (the fallback for `undefined`) during this window.

By passing the price and 24-hour change already known from the trending list, `TokenDetailsScreen` can show plausible values instantly:

```ts
const price = overview?.price ?? seedPrice ?? 0;
const change = overview?.priceChange24h ?? seedChange ?? 0;
```

The displayed price and change may differ slightly from the overview response (the trending list data could be up to 60 seconds old due to `useTrendingTokens`' refetch interval). Once `useTokenOverview` resolves, the values update to live data. This is a deliberate trade-off: briefly stale data is shown for better perceived performance, rather than a blank or spinner in the price area.

---

## Screens

### `SignInScreen` (`src/screens/SignInScreen.tsx`)

Two-step form managing local state: `step` (`'email' | 'code'`), `email`, `code`, `busy`, `error`. Uses `useLoginWithEmail` and `useLoginWithOAuth` from `@privy-io/expo`. No navigation calls — Privy's auth state change causes `RootNavigator` to swap the rendered tree. See [Auth and Wallet](02_auth_and_wallet.md).

### `TrendingScreen` (`src/screens/TrendingScreen.tsx`)

Renders a `FlatList` of `TokenRow` items backed by `useTrendingTokens`. Pull-to-refresh calls `refetch()` from TanStack Query. Pressing a row calls `navigation.navigate('TokenDetails', toTokenDetailsParams(token))`. A network indicator pill in the header shows the current Solana network (green = mainnet, yellow = devnet).

The `renderItem` and `openToken` callbacks are wrapped in `useCallback` to prevent re-creating them on every render.

### `TokenDetailsScreen` (`src/screens/TokenDetailsScreen.tsx`)

Uses three hooks: `useTokenOverview` (price + stats), `useTokenChart` (OHLCV data), `useTokenTrades` (recent trades list). Range selector (`1H | 1D | 1W | 1M`) is local state; changing it changes the `useTokenChart` query key, triggering a fresh fetch.

`SwapPanel` is rendered conditionally: `{overview && <SwapPanel token={overview} />}`. It only mounts once the overview has loaded, because `SwapPanel` needs `token.decimals` to compute the estimated output amount.

The screen uses `SafeAreaView` directly (with `edges={['top']}`) rather than the shared `Screen` component, giving it more control over the header layout.

### `PortfolioScreen` (`src/screens/PortfolioScreen.tsx`)

Uses `useWallet` for `address`, `logout`, `ensureWallet`; `usePortfolio` and `useActivity` for data; `useNetWorthHistory` for the net-worth chart data.

The net-worth `PriceChart` renders only when `netWorth.length > 1` (checked in `renderHeader` at line 76).

The "Receive" FAB opens a `Modal` sheet displaying the wallet address as selectable text, with a copy button and a Solscan link. The Solscan link uses `explorerUrl(address, 'address')` from `src/lib/solana.ts`.

On devnet, a "Request 1 SOL (Devnet Airdrop)" button is visible, which calls `requestDevnetAirdrop` from `src/api/portfolio.ts` followed by `refetch()`. This button is hidden on mainnet (`!ENV.isMainnet`).

`ActivitySection` renders a maximum of 12 transactions (`activity.slice(0, 12)`). Each row is a `Pressable` that opens a Solscan transaction link.

`onRefresh` calls both `ensureWallet()` and `refetch()` in parallel with `Promise.all`.

---

## Components (`src/components/`)

| Component | File | What it renders | Used by |
|-----------|------|-----------------|---------|
| `Button` | `Button.tsx` | Full-width pressable with `primary`, `secondary`, and `ghost` variants. Shows `ActivityIndicator` when `loading=true`. | SignInScreen, PortfolioScreen, SwapPanel, States |
| `PercentBadge` | `PercentBadge.tsx` | Formatted percentage string, optionally with a colored background pill. `subtle=true` renders text-only without the background. | TokenRow, TokenDetailsScreen |
| `PriceChart` | `PriceChart.tsx` | Filled area + line chart built with `react-native-svg`. Color (green or red) is derived by comparing first and last close prices. Renders an empty surface if fewer than 2 data points. | TokenDetailsScreen, PortfolioScreen |
| `Screen` | `Screen.tsx` | `SafeAreaView` wrapper with optional horizontal padding. Default `edges={['top']}`. | SignInScreen, TrendingScreen |
| `Sparkline` | `Sparkline.tsx` | Lightweight SVG polyline (72×28 px by default). Renders nothing (empty `View`) if fewer than 2 points. Color is green if last value ≥ first value, otherwise red. | TokenRow |
| `StatCard` | `StatCard.tsx` | Labeled value card with surface background and border. `flex: 1` so two cards side-by-side fill the row evenly. | TokenDetailsScreen |
| `States` | `States.tsx` | Three layout components: `LoadingState` (spinner + label), `ErrorState` (title + message + optional retry button), `EmptyState` (title + optional subtitle). | TrendingScreen, PortfolioScreen, TokenDetailsScreen |
| `SwapPanel` | `SwapPanel.tsx` | Jupiter swap UI panel. Manages amount input, preset buttons, quote display, and buy button. Wraps `useSwap`. See [Trading Flow](05_trading_flow.md). | TokenDetailsScreen |
| `TokenLogo` | `TokenLogo.tsx` | Circular `Image` from a URI. Falls back to a colored circle showing the first two letters of the symbol if the URI is absent or fails to load. | TokenRow, PortfolioScreen, TokenDetailsScreen |
| `TokenRow` | `TokenRow.tsx` | One row in the trending list: rank, logo, symbol, 24h volume, sparkline, price, percent change. Memoized with `React.memo`. | TrendingScreen |
