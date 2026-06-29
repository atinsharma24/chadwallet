// Crypto + buffer + URL polyfills required by @solana/web3.js and Privy on RN.
// This file must be imported first (see index.js).
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'fast-text-encoding';
import { Buffer } from 'buffer';

const g = global as unknown as { Buffer?: unknown; process?: unknown };

if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}

// React Native usually defines a minimal `process`, but some web3 deps read
// fields it omits. Provide a safe fallback without pulling a node polyfill.
if (typeof g.process === 'undefined') {
  g.process = { env: {}, version: '', browser: true, nextTick: (fn: () => void) => setTimeout(fn, 0) };
}
