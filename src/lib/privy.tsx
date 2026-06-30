import React from 'react';
import { PrivyProvider as BasePrivyProvider } from '@privy-io/expo';
import { PrivyElements } from '@privy-io/expo/ui';
import { ENV } from '@/config/env';
import { colors } from '@/theme';

// Wraps the app in Privy's provider configured for the embedded Solana wallet.
// Email + Google login are enabled in the Privy dashboard; this provider just
// supplies the appId/clientId and renders <PrivyElements/> for native UI.
export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider
      appId={ENV.privyAppId}
      clientId={ENV.privyClientId}
      config={{
        embedded: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
      <PrivyElements config={{ appearance: { colorScheme: 'dark', accentColor: colors.primary } }} />
    </BasePrivyProvider>
  );
}
