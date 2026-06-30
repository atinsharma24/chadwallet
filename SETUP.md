# ChadWallet — Setup & Deployment Guide

This walks you from a fresh clone to a running app and an **Appetize.io** preview.
Everything here uses **free tiers**.

---

## 0. Prerequisites

- Node 18+ and npm
- A physical device or emulator (Android Studio / Xcode), **or** an Expo/EAS
  account for cloud builds
- Git

```bash
npm install
cp .env.example .env
```

---

## 1. Get your API credentials

### 1a. Privy (auth + embedded wallet) — required

1. Create an app at <https://dashboard.privy.io>.
2. Copy the **App ID** → `EXPO_PUBLIC_PRIVY_APP_ID`.
3. (Recommended) create a **Client ID** for native apps → `EXPO_PUBLIC_PRIVY_CLIENT_ID`.
4. In **Login methods**, enable **Email** and **Google**.
5. In **Embedded wallets**, enable **Solana** and "create on login".

### 1b. Alchemy (Solana RPC) — required

1. <https://dashboard.alchemy.com> → **Create App**.
2. Make one app on **Solana → Devnet** and one on **Solana → Mainnet**.
3. Copy each API key:
   - Devnet key → `EXPO_PUBLIC_ALCHEMY_DEVNET_KEY`
   - Mainnet key → `EXPO_PUBLIC_ALCHEMY_MAINNET_KEY`

### 1c. Birdeye (market data) — required

1. <https://birdeye.so> → developer dashboard → create a free API key.
2. For **local dev**, paste into `EXPO_PUBLIC_DEV_BIRDEYE_KEY`.
3. For **production**, leave that blank and put the key in the Cloudflare Worker
   (step 2) so it never ships in the app bundle.

### 1d. Codex.io (GraphQL fallback) — optional but recommended

1. <https://www.codex.io> → sign up. **A card is required, but DO NOT send the
   one-time $1 USDC payment** — the free tier works without it.
2. Create an API key → `EXPO_PUBLIC_DEV_CODEX_KEY` (dev) or Worker secret (prod).

### 1e. Supabase (optional backup)

1. <https://supabase.com> → new project.
2. Project Settings → API → copy URL + anon key into
   `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## 2. Deploy the Cloudflare Worker (hides secret keys)

Recommended for anything beyond local dev — keeps Birdeye/Codex keys server-side.

```bash
npm i -g wrangler
cd cloudflare
wrangler login
wrangler secret put BIRDEYE_API_KEY     # paste your Birdeye key
wrangler secret put CODEX_API_KEY        # paste your Codex key
wrangler deploy
```

Copy the deployed URL (e.g. `https://chadwallet-proxy.<you>.workers.dev`) into
`EXPO_PUBLIC_API_PROXY_URL`. The app will now route Birdeye/Codex through it and
you can remove the `EXPO_PUBLIC_DEV_*` keys.

---

## 3. Run locally (Devnet first)

Expo Go **won't** work (native crypto/Privy modules). Build a dev client:

```bash
# Android (device/emulator)
npx expo run:android

# iOS (macOS only)
npx expo run:ios

# Then start the bundler for subsequent runs:
npm run start
```

**Test checklist (Devnet):**
1. **Auth** → sign in with email OTP, then try Google.
2. A Solana embedded wallet is auto-created.
3. **Trending** → tokens load; pull-to-refresh works; sparklines render.
4. **Token Details** → chart + stats + recent trades load; switch ranges.
5. **Portfolio** → open the **Receive FAB**, copy address, tap **Request 1 SOL
   (Devnet Airdrop)**, confirm balance updates.

> Note: Birdeye/Codex return **mainnet** market data (there's no devnet memecoin
> market). Devnet is used for **wallet/balance/airdrop/tx** flows. Swaps are
> mainnet-only (Jupiter has no devnet liquidity) and show a preview state on devnet.

---

## 4. Switch to Mainnet

Once Devnet flows are verified:

```dotenv
EXPO_PUBLIC_SOLANA_NETWORK=mainnet
EXPO_PUBLIC_ALCHEMY_MAINNET_KEY=...   # must be set
```

Rebuild. Portfolio + RPC now hit mainnet and **live Jupiter swaps are enabled**.
Start with tiny amounts (e.g. 0.01 SOL) when testing real swaps.

---

## 5. Build for Appetize.io

Appetize runs a native build (`.apk` for Android, `.app`/simulator build for iOS).
The `preview` profile in `eas.json` is already set up for this (Android `apk`,
iOS `simulator: true`).

> The standalone preview build bundles JS at build time, so it does **not** use a
> local Metro server and is unaffected by the local `api.expo.dev` manifest hang
> (the `--offline` workaround only matters for `npm run start` on this machine).
> EAS's cloud builders reach `api.expo.dev` normally.

### 5a. Link the project (one-time)

```bash
npm i -g eas-cli
eas login
eas init                      # creates/links the EAS project and writes the real
                              # projectId into app.json (replaces the
                              # REPLACE_WITH_EAS_PROJECT_ID placeholder)
```

### 5b. Provide build-time env vars (required)

A standalone build inlines `EXPO_PUBLIC_*` vars at build time — they are not read
from your local `.env` by the cloud builder. Register them once with EAS so the
preview behaves like local dev:

```bash
# Repeat for each EXPO_PUBLIC_* var the app needs (preview environment):
eas env:create --environment preview --name EXPO_PUBLIC_PRIVY_APP_ID      --value "<your value>"
eas env:create --environment preview --name EXPO_PUBLIC_PRIVY_CLIENT_ID   --value "<your value>"
eas env:create --environment preview --name EXPO_PUBLIC_SOLANA_NETWORK    --value "devnet"
eas env:create --environment preview --name EXPO_PUBLIC_ALCHEMY_DEVNET_KEY  --value "<your value>"
eas env:create --environment preview --name EXPO_PUBLIC_ALCHEMY_MAINNET_KEY --value "<your value>"
eas env:create --environment preview --name EXPO_PUBLIC_DEV_BIRDEYE_KEY   --value "<your value>"
eas env:create --environment preview --name EXPO_PUBLIC_DEV_CODEX_KEY     --value "<your value>"
```

(These are `EXPO_PUBLIC_*` — they ship in the bundle by design, same as local dev.
For a hardened build, deploy the Cloudflare Worker and set `EXPO_PUBLIC_API_PROXY_URL`
instead of the dev keys — see step 2.)

### 5c. Create the build

```bash
# Android APK (simplest for Appetize):
eas build --profile preview --platform android

# iOS simulator build (for Appetize iOS):
eas build --profile preview --platform ios
```

When the build finishes, EAS prints a download URL for the artifact.

### 5d. Upload to Appetize

1. Download the `.apk` (Android) or simulator `.app`/`.tar.gz` (iOS) from the EAS build page.
2. Go to <https://appetize.io/upload>, upload the artifact (free tier is fine).
3. Appetize returns a **public preview link** — that's the deliverable to share.

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `Unable to resolve @privy-io/expo/ui` | Ensure `metro.config.js` sets `resolver.unstable_enablePackageExports = true` (already configured). |
| Blank trending list | Missing Birdeye key/proxy. Set `EXPO_PUBLIC_DEV_BIRDEYE_KEY` or `EXPO_PUBLIC_API_PROXY_URL`. |
| Crypto / `Buffer is not defined` | `index.js` must import `./src/lib/polyfills` first (already wired). |
| Privy login does nothing | Confirm App ID + that Email/Google are enabled in the Privy dashboard. |
| Swap disabled | Expected on Devnet. Switch to Mainnet to enable Jupiter swaps. |
| `expo install` network error | Use `npm install` with pinned versions (this repo already pins them). |
| Dev client stuck on "There was a problem loading the project" / `timeout` (OkHttp `HeadersReader`) | The Expo dev server's manifest endpoint (`GET /`) blocks on a no-timeout request to `https://api.expo.dev/v2/project/configuration/schema/<sdk>` when that host is unreachable (VPN/proxy/offline). The bundle endpoint works, but the dev client fetches the manifest first and times out. Run Metro with `--offline` (already wired into `npm run start`) to skip that call. |

---

## Branding

Replace the placeholders in `assets/` (`icon.png`, `adaptive-icon.png`,
`splash.png`) with the official ChadWallet art from the shared Drive folder, and
update the accent hexes in `src/theme/index.ts` to the exact brand palette.
