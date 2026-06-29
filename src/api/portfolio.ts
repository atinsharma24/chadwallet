import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana';
import { SOL_MINT } from '@/config/env';
import { fetchMultiPrice } from './birdeye';

// ---------------------------------------------------------------------------
// Portfolio data via Alchemy Solana RPC (getBalance, getParsedTokenAccounts,
// getSignaturesForAddress) + Birdeye for USD valuation.
// ---------------------------------------------------------------------------

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export interface Holding {
  mint: string;
  amount: number; // ui amount
  decimals: number;
  priceUsd: number;
  valueUsd: number;
  isSol?: boolean;
}

export interface Portfolio {
  solBalance: number;
  totalUsd: number;
  holdings: Holding[];
}

export async function fetchPortfolio(owner: string): Promise<Portfolio> {
  const connection = getConnection();
  const ownerKey = new PublicKey(owner);

  const [lamports, tokenAccounts] = await Promise.all([
    connection.getBalance(ownerKey),
    connection.getParsedTokenAccountsByOwner(ownerKey, { programId: TOKEN_PROGRAM_ID }),
  ]);

  const solBalance = lamports / LAMPORTS_PER_SOL;

  const rawHoldings = tokenAccounts.value
    .map((acc) => {
      const info = acc.account.data.parsed.info;
      const tokenAmount = info.tokenAmount;
      return {
        mint: info.mint as string,
        amount: tokenAmount.uiAmount as number,
        decimals: tokenAmount.decimals as number,
      };
    })
    .filter((h) => h.amount && h.amount > 0);

  // Price everything (incl. SOL) in one batched Birdeye call.
  const mints = [SOL_MINT, ...rawHoldings.map((h) => h.mint)];
  const prices = await fetchMultiPrice(mints).catch(() => ({}) as Record<string, number>);

  const solPrice = prices[SOL_MINT] ?? 0;
  const holdings: Holding[] = [
    {
      mint: SOL_MINT,
      amount: solBalance,
      decimals: 9,
      priceUsd: solPrice,
      valueUsd: solBalance * solPrice,
      isSol: true,
    },
    ...rawHoldings.map((h) => {
      const priceUsd = prices[h.mint] ?? 0;
      return { ...h, priceUsd, valueUsd: h.amount * priceUsd };
    }),
  ];

  holdings.sort((a, b) => b.valueUsd - a.valueUsd);
  const totalUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);

  return { solBalance, totalUsd, holdings };
}

export interface ActivityItem {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: boolean;
}

export async function fetchActivity(owner: string, limit = 20): Promise<ActivityItem[]> {
  const connection = getConnection();
  const sigs = await connection.getSignaturesForAddress(new PublicKey(owner), { limit });
  return sigs.map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime ?? null,
    err: s.err != null,
  }));
}

/** Request a devnet airdrop (1 SOL) for testing. No-op on mainnet. */
export async function requestDevnetAirdrop(owner: string): Promise<string> {
  const connection = getConnection();
  const sig = await connection.requestAirdrop(new PublicKey(owner), LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
