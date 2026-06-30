# Testing and Gaps

## Current state of automated testing

There are no automated tests in this repository. Confirmed by inspection:

- No `__tests__` directory exists anywhere in the project tree.
- No files matching `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` exist.
- `package.json` has no `test` script and no test runner (`jest`, `vitest`, `@testing-library/react-native`) in either `dependencies` or `devDependencies`.

---

## Current verification: manual test checklist (from `SETUP.md`)

This is the only documented verification process for the app:

1. **Auth** — sign in with email OTP, then try Google.
2. A Solana embedded wallet is auto-created (confirm wallet address appears in Portfolio → Receive).
3. **Trending** — tokens load; pull-to-refresh works; sparklines render.
4. **Token Details** — chart and stats and recent trades load; switch ranges (1H/1D/1W/1M).
5. **Portfolio** — open the Receive FAB, copy address, tap "Request 1 SOL (Devnet Airdrop)", confirm balance updates.

The checklist does not cover: error states, the Codex fallback, swap flow, the net-worth chart, sign-out, navigation back gestures, or behavior when keys are missing.

---

## Proposed testing strategy

### Priority 1 — pure functions (no React, no network)

`src/theme/format.ts` exports five functions with no dependencies:

- `formatUsd(value, opts?)` — handles undefined, null, NaN, sub-penny values, compact notation.
- `compactNumber(value)` — handles B/M/K thresholds and edge cases at those boundaries.
- `formatPercent(value)` — sign prefix, two decimal places.
- `formatTokenAmount(value, maxFrac?)` — locale string with configurable decimals.
- `timeAgo(unixSeconds)` — converts elapsed seconds to human-readable string.

These are the cheapest starting point: plain unit tests, no mocking required, no React renderer. Approximately 30–40 test cases would cover all branches and edge cases (undefined inputs, zero, negative values, boundary values at 1K, 1M, 1B).

The helper functions `shortAddress` and `rpcEndpoint` in `src/lib/solana.ts` are also pure and testable without a network connection.

### Priority 2 — API client transformation logic

The mapping functions in `src/api/birdeye.ts` (`fetchTrendingTokens`, `fetchTokenOverview`, etc.) and `src/api/codex.ts` (`fetchTrendingTokensCodex`, `fetchBarsCodex`) transform API responses into normalized domain types. These transformations include non-obvious conversions:

- Codex `change24` is a ratio (e.g. `0.12`) that must be multiplied by 100 to become a percentage — mismatch with this conversion would cause wrong price change display.
- `fetchMultiPrice` maps a nested `Record<string, { value: number }>` structure to a flat price map.
- `fetchBarsCodex` filters null close prices from parallel arrays.

These can be tested by constructing a mock `fetch` response and asserting on the returned domain object. The transformation code is in plain functions that take a raw API response object and return a domain type, so testing them in isolation requires only minimal `fetch` mocking.

The `loadTrending` function in `src/hooks/useTrendingTokens.ts` and `loadChart` in `src/hooks/useTokenDetails.ts` contain the primary/fallback branching logic. These are worth unit-testing to confirm that an empty Birdeye result triggers the Codex path, not just a thrown error.

### Priority 3 — hooks with mocked TanStack Query

`@testing-library/react-native` combined with TanStack Query's test utilities can test hook behavior without mounting full screens. Candidates:

- `useTrendingTokens` — verify the Codex fallback fires when Birdeye returns empty.
- `useTokenChart` — verify the `> 1` point threshold triggers Codex.
- `useNetWorthHistory` — verify snapshots accumulate correctly in AsyncStorage (this can be tested with a mock `AsyncStorage`).

### Priority 4 — end-to-end

An E2E tool (Maestro or Detox) would be appropriate for testing the four main screen flows:

- Auth flow: email sign-in completes, tab navigator is shown.
- Trending flow: list renders, tapping a row opens Token Details.
- Portfolio flow: balance loads, Receive sheet opens, address is copyable.
- Swap flow (mainnet only): quote is fetched and displayed, buy button is enabled.

E2E requires a dev client build and a real or emulated device. Given the dependency on Privy for auth, E2E tests would need either a test Privy account or Privy's test mode. This is the most expensive tier to set up and should follow once unit and hook tests are in place.

---

## Known gaps beyond testing

- No error boundary in the React tree. An unhandled render error will crash the app with a red screen in development and a blank white screen in production. The `LoadingState`, `ErrorState`, and `EmptyState` components handle data-fetch errors but not render errors.
- No quote expiry handling in `SwapPanel`. Jupiter quotes are valid for approximately 30 seconds server-side; the app does not warn the user or invalidate the quote after that window.
- `requestDevnetAirdrop` has no guard against being called on mainnet. The function will call `connection.requestAirdrop` regardless of network; the RPC will reject it on mainnet, but the error message shown to the user ("Airdrop failed: ...") may be confusing. The UI button is hidden on mainnet (`!ENV.isMainnet`), but the function itself has no such guard.
