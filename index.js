// Polyfills MUST be imported before anything else (Solana web3, Privy, fetch URLs).
import './src/lib/polyfills';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
