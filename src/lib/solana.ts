import { Connection, clusterApiUrl } from '@solana/web3.js';
import { ENV, SolanaNetwork } from '@/config/env';

// Build the RPC endpoint. Prefer Alchemy; fall back to public clusterApiUrl
// so the app still functions (read-only) before keys are configured.
export function rpcEndpoint(network: SolanaNetwork = ENV.network): string {
  if (network === 'mainnet') {
    return ENV.alchemyMainnetKey
      ? `https://solana-mainnet.g.alchemy.com/v2/${ENV.alchemyMainnetKey}`
      : clusterApiUrl('mainnet-beta');
  }
  return ENV.alchemyDevnetKey
    ? `https://solana-devnet.g.alchemy.com/v2/${ENV.alchemyDevnetKey}`
    : clusterApiUrl('devnet');
}

let cached: { network: SolanaNetwork; connection: Connection } | null = null;

export function getConnection(network: SolanaNetwork = ENV.network): Connection {
  if (cached && cached.network === network) return cached.connection;
  const connection = new Connection(rpcEndpoint(network), 'confirmed');
  cached = { network, connection };
  return connection;
}

export function explorerUrl(signatureOrAddress: string, kind: 'tx' | 'address' = 'tx'): string {
  const cluster = ENV.isMainnet ? '' : '?cluster=devnet';
  return `https://solscan.io/${kind === 'tx' ? 'tx' : 'account'}/${signatureOrAddress}${cluster}`;
}

export function shortAddress(addr?: string, chars = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
