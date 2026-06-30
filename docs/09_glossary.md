# Glossary

Terms that appear in the codebase, defined for someone who knows React Native but is new to Solana.

---

**devnet vs mainnet-beta**
Solana runs two persistent public networks. `devnet` is a test network with free airdrops and no real money; `mainnet-beta` is the production network where tokens have real value. The app selects between them with `EXPO_PUBLIC_SOLANA_NETWORK`. In this codebase, "mainnet" always means `mainnet-beta`.

**embedded wallet**
A Solana wallet whose private key is generated and stored by a third-party service (Privy in this case) rather than by the user. The key lives in Privy's infrastructure. This is the opposite of a self-custody wallet like Phantom, where the user holds the seed phrase and the key never leaves their device.

**lamports**
The smallest denomination of SOL, analogous to satoshis in Bitcoin or wei in Ethereum. 1 SOL = 1,000,000,000 lamports (`LAMPORTS_PER_SOL` from `@solana/web3.js`). The Jupiter API and Solana RPC work in lamports; the app converts to SOL for display.

**mint address**
The public key of an SPL token program account that defines a specific token — its supply, decimals, and mint authority. In the codebase, `SOL_MINT = 'So111...112'` is the wrapped SOL mint, and token mint addresses appear throughout `src/api/types.ts` and `src/api/portfolio.ts`. A mint address uniquely identifies a token the way a contract address does in Ethereum.

**RPC endpoint**
A Solana JSON-RPC server that the app queries for on-chain data. `getConnection()` in `src/lib/solana.ts` builds a `@solana/web3.js` `Connection` object pointed at Alchemy's RPC URL. All balance reads and transaction submissions go through this endpoint.

**self-custody wallet**
A wallet where the user holds the seed phrase and the private key is never sent to any third party (Phantom, Solflare, Ledger). Contrast with [embedded wallet](#embedded-wallet). This app does not support connecting a self-custody wallet.

**slippage in basis points**
Slippage is the maximum acceptable price movement between when a swap quote is calculated and when the transaction confirms on-chain. One basis point (bps) = 0.01%. The app uses `slippageBps: 100` (1%). If the actual execution price is worse than 1% from the quoted price, the transaction fails rather than executing at an unfavorable price.

**SOL**
The native token of the Solana blockchain, used to pay transaction fees (called "gas" in Ethereum terminology, but Solana calls them "transaction fees"). Portfolio balances and swap amounts are denominated in SOL.

**SPL token**
Solana Program Library token — the Solana equivalent of an ERC-20 token. All non-SOL tokens (memecoins included) are SPL tokens. Each SPL token account has a mint address, an owner (the wallet), and a balance.

**swap route**
The sequence of liquidity pools and DEXes that Jupiter's aggregator routes a swap through to achieve the best output amount. Displayed in the quote box as `DEX1 → DEX2 → ...`. A direct route uses one pool; a multi-hop route may go through two or three to get a better price.

**versioned transaction**
A Solana transaction format introduced in 2022 that supports Address Lookup Tables, reducing transaction size for complex swaps. Jupiter's `/swap` endpoint returns a `VersionedTransaction` serialized as base64. The app deserializes it with `VersionedTransaction.deserialize(txBuffer)` from `@solana/web3.js` before signing.
