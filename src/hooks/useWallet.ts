import { useCallback, useMemo } from 'react';
import {
  usePrivy,
  useEmbeddedSolanaWallet,
  getUserEmbeddedSolanaWallet,
} from '@privy-io/expo';

// Convenience facade over Privy's auth + embedded Solana wallet so screens
// don't depend on Privy internals directly.
export function useWallet() {
  const { user, isReady, logout } = usePrivy();
  const { wallets, create } = useEmbeddedSolanaWallet();

  const wallet = wallets?.[0];
  const address = useMemo(
    () => wallet?.address ?? getUserEmbeddedSolanaWallet(user)?.address,
    [wallet, user],
  );

  const ensureWallet = useCallback(async () => {
    if (!wallet && create) await create();
  }, [wallet, create]);

  return {
    isReady,
    isAuthenticated: !!user,
    user,
    wallet,
    address,
    ensureWallet,
    logout,
  };
}
