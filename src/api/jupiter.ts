import { jsonFetch } from './http';

// ---------------------------------------------------------------------------
// Jupiter Aggregator API (https://developers.jup.ag) — quotes + swap tx build.
// NOTE: Jupiter routing/liquidity is MAINNET ONLY. On devnet the swap UI is
// shown in a disabled "preview" state (see TokenDetailsScreen / useSwap).
// ---------------------------------------------------------------------------

const JUP_BASE = 'https://quote-api.jup.ag/v6';

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: { swapInfo: { label: string }; percent: number }[];
  // Full opaque payload required by the /swap endpoint.
  [key: string]: unknown;
}

export async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string | number; // in base units (lamports / token decimals)
  slippageBps?: number;
}): Promise<JupiterQuote> {
  const { inputMint, outputMint, amount, slippageBps = 100 } = params;
  const qs = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
    swapMode: 'ExactIn',
  });
  return jsonFetch<JupiterQuote>(`${JUP_BASE}/quote?${qs.toString()}`);
}

export interface JupiterSwapResponse {
  swapTransaction: string; // base64 serialized VersionedTransaction
  lastValidBlockHeight: number;
}

export async function getJupiterSwapTransaction(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}): Promise<JupiterSwapResponse> {
  const { quoteResponse, userPublicKey, wrapAndUnwrapSol = true } = params;
  return jsonFetch<JupiterSwapResponse>(`${JUP_BASE}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
}
