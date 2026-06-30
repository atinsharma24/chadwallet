# ChadWallet — Documentation Index

Entry point for all technical documentation. Each document covers one concern only; cross-references are inline links rather than duplicated content.

---

## Documents

**[01 — Architecture](01_architecture.md)**
How the major external services (Privy, Alchemy, Birdeye, Codex, Jupiter, Cloudflare Worker, Supabase) fit together, and the data path from a screen to each upstream API. Includes a flowchart of the full request pipeline. Start here if you are new to the codebase or need to understand why a service call is failing.

**[02 — Auth and Wallet](02_auth_and_wallet.md)**
The sign-in flow (email OTP and Google OAuth), when the embedded Solana wallet is created, and how `RootNavigator` uses auth state to gate the tab stack. Includes sequence diagrams for both login paths. Read this before touching anything in `src/lib/privy.tsx`, `src/hooks/useWallet.ts`, `src/navigation/RootNavigator.tsx`, or `src/screens/SignInScreen.tsx`.

**[03 — Data Layer](03_data_layer.md)**
TanStack Query configuration and every hook in `src/hooks/`. Documents the global defaults from `queryClient.ts`, the per-hook poll intervals and stale times with the rationale behind each value, and the Birdeye-primary / Codex-fallback pattern used in trending and chart queries. Read this when debugging stale data, understanding refetch cadence, or adding a new hook.

**[04 — API Clients](04_api_clients.md)**
One section per file in `src/api/`: `http.ts`, `birdeye.ts`, `codex.ts`, `jupiter.ts`, `portfolio.ts`. Covers every exported function, its parameters and return type, the upstream endpoint it calls, and edge cases (fields that can be undefined or zero). The critical `marketFetch` proxy/direct branching logic is explained here.

**[05 — Trading Flow](05_trading_flow.md)**
The Jupiter swap lifecycle from amount input to confirmed signature, as implemented in `src/hooks/useSwap.ts` and `src/components/SwapPanel.tsx`. Includes a sequence diagram of the state machine. Covers mainnet gating, slippage, quote staleness behaviour, and the exact signing mechanism through Privy's embedded wallet provider.

**[06 — Screens and Navigation](06_screens_and_navigation.md)**
The four screens, the two-level navigation structure, the `seedPrice`/`seedChange` pattern for instant header rendering on `TokenDetails`, and an inventory of all components in `src/components/`.

**[07 — Environment Reference](07_environment_reference.md)**
A table of every variable in `.env.example`, cross-referenced against `src/config/env.ts`. Explains what each variable does, where to obtain it, and what specifically degrades (not just "the app breaks") when it is absent. Traces the full Birdeye → Codex fallback chain for the case where both keys are missing.

**[08 — Decision Log](08_decisions.md)**
One entry per non-obvious design choice in the codebase: the Cloudflare Worker proxy, the dual-provider market data strategy, TanStack Query vs zustand (and whether zustand is actually used), Privy embedded wallet, local AsyncStorage net-worth history, and React Navigation native stack. Each entry states what was decided, why, what the alternative would have been, and what tradeoff was accepted.

**[09 — Glossary](09_glossary.md)**
Plain-language definitions of Solana and crypto terms that appear in the codebase: lamports, mint address, SPL token, slippage in basis points, versioned transaction, devnet vs mainnet-beta, RPC endpoint, embedded wallet vs self-custody, swap route.

**[10 — Testing and Gaps](10_testing_and_gaps.md)**
Honest accounting of the current verification state (no automated tests), the manual test checklist from `SETUP.md`, and a proposed testing strategy identifying the cheapest first targets and where an end-to-end tool would fit.

**[talking_points.md](talking_points.md)**
One-page cheat sheet for a review call: single-sentence architecture summary, the three most interesting engineering decisions, two honest limitations to raise proactively, and a likely follow-up question with a short answer for each decision.
