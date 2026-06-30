// Crypto + buffer + URL polyfills required by @solana/web3.js and Privy on RN.
// This file must be imported first (see index.js).
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
// @ts-expect-error - text-encoding ships no type declarations
import { TextEncoder, TextDecoder } from 'text-encoding';
import { Buffer } from 'buffer';

// Hermes ships its own native TextEncoder/TextDecoder, but its TextDecoder
// rejects the `fatal` option that @solana/web3.js relies on (throws
// "Failed to construct 'TextDecoder': the 'fatal' option is unsupported").
// fast-text-encoding does not help: it skips its own polyfill when a global
// already exists, and its decoder also throws on `fatal`. So override both
// globals unconditionally with the `text-encoding` implementation (which
// supports `fatal`), ahead of any Solana import.
const te = global as unknown as { TextEncoder?: unknown; TextDecoder?: unknown };
te.TextEncoder = TextEncoder;
te.TextDecoder = TextDecoder;

const g = global as unknown as { Buffer?: unknown; process?: unknown };

if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}

// React Native usually defines a minimal `process`, but some web3 deps read
// fields it omits. Provide a safe fallback without pulling a node polyfill.
if (typeof g.process === 'undefined') {
  g.process = { env: {}, version: '', browser: true, nextTick: (fn: () => void) => setTimeout(fn, 0) };
}
