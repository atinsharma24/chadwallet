import { useState, useCallback } from 'react';
import { VersionedTransaction } from '@solana/web3.js';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { getJupiterQuote, getJupiterSwapTransaction, JupiterQuote } from '@/api/jupiter';
import { getConnection } from '@/lib/solana';
import { ENV } from '@/config/env';

type SwapState = 'idle' | 'quoting' | 'signing' | 'sending' | 'success' | 'error';

/**
 * Jupiter swap flow against the Privy embedded Solana wallet.
 * Jupiter only has liquidity on mainnet, so swapping is gated behind
 * ENV.isMainnet — on devnet the UI stays in preview/disabled mode.
 */
export function useSwap() {
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];

  const [state, setState] = useState<SwapState>('idle');
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const supported = ENV.isMainnet;

  const fetchQuote = useCallback(
    async (params: {
      inputMint: string;
      outputMint: string;
      amount: string | number;
      slippageBps?: number;
    }) => {
      setState('quoting');
      setError(null);
      try {
        const q = await getJupiterQuote(params);
        setQuote(q);
        setState('idle');
        return q;
      } catch (e) {
        setError((e as Error).message);
        setState('error');
        return null;
      }
    },
    [],
  );

  const executeSwap = useCallback(async () => {
    if (!supported) {
      setError('Swaps require Mainnet (Jupiter has no devnet liquidity).');
      setState('error');
      return null;
    }
    if (!quote || !wallet?.address) {
      setError('No quote or wallet available.');
      setState('error');
      return null;
    }
    try {
      setState('signing');
      const { swapTransaction } = await getJupiterSwapTransaction({
        quoteResponse: quote,
        userPublicKey: wallet.address,
      });

      const txBuffer = Buffer.from(swapTransaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);

      const provider = await wallet.getProvider();
      setState('sending');
      const connection = getConnection();
      const { signature: sig } = await provider.request({
        method: 'signAndSendTransaction',
        params: { transaction: tx, connection },
      });

      setSignature(sig);
      setState('success');
      return sig;
    } catch (e) {
      setError((e as Error).message);
      setState('error');
      return null;
    }
  }, [quote, wallet, supported]);

  const reset = useCallback(() => {
    setState('idle');
    setQuote(null);
    setError(null);
    setSignature(null);
  }, []);

  return { state, quote, error, signature, supported, fetchQuote, executeSwap, reset };
}
