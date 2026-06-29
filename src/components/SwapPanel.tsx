import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Linking } from 'react-native';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from './Button';
import { useSwap } from '@/hooks/useSwap';
import { useWallet } from '@/hooks/useWallet';
import { SOL_MINT } from '@/config/env';
import { explorerUrl } from '@/lib/solana';
import { colors, radius, spacing, typography } from '@/theme';
import { TokenOverview } from '@/api/types';
import { formatTokenAmount } from '@/theme/format';

const PRESETS = [0.05, 0.1, 0.5, 1];

export function SwapPanel({ token }: { token: TokenOverview }) {
  const { address, isAuthenticated } = useWallet();
  const { state, quote, error, signature, supported, fetchQuote, executeSwap, reset } = useSwap();
  const [amount, setAmount] = useState('0.1');

  const estimatedOut =
    quote && token.decimals
      ? Number(quote.outAmount) / 10 ** token.decimals
      : null;

  const handleQuote = () => {
    const sol = parseFloat(amount);
    if (!sol || sol <= 0) return;
    reset();
    fetchQuote({
      inputMint: SOL_MINT,
      outputMint: token.address,
      amount: Math.round(sol * LAMPORTS_PER_SOL),
      slippageBps: 100,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Buy {token.symbol}</Text>
        <Text style={styles.payWith}>Pay with SOL</Text>
      </View>

      {!supported && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Live swaps run on Mainnet (Jupiter has no Devnet liquidity). This is a preview on
            Devnet — switch network in config to trade.
          </Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={styles.inputSuffix}>SOL</Text>
      </View>

      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <Text
            key={p}
            onPress={() => setAmount(String(p))}
            style={[styles.preset, amount === String(p) && styles.presetActive]}
          >
            {p}
          </Text>
        ))}
      </View>

      {estimatedOut != null && (
        <View style={styles.quoteBox}>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>You receive ≈</Text>
            <Text style={styles.quoteValue}>
              {formatTokenAmount(estimatedOut)} {token.symbol}
            </Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Price impact</Text>
            <Text style={styles.quoteValue}>
              {(Number(quote?.priceImpactPct ?? 0) * 100).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Route</Text>
            <Text style={styles.quoteValue} numberOfLines={1}>
              {quote?.routePlan?.map((r) => r.swapInfo.label).join(' → ') ?? 'Jupiter'}
            </Text>
          </View>
        </View>
      )}

      {state === 'success' && signature ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>Swap submitted ✓</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(explorerUrl(signature))}>
            View on Solscan
          </Text>
        </View>
      ) : estimatedOut != null ? (
        <Button
          title={supported ? `Buy ${token.symbol}` : 'Preview only (Devnet)'}
          onPress={executeSwap}
          loading={state === 'signing' || state === 'sending'}
          disabled={!supported || !isAuthenticated || !address}
        />
      ) : (
        <Button
          title="Get Quote"
          variant="secondary"
          onPress={handleQuote}
          loading={state === 'quoting'}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { ...typography.h3, color: colors.text },
  payWith: { ...typography.caption, color: colors.textSecondary },
  notice: { backgroundColor: colors.secondaryDim, borderRadius: radius.sm, padding: spacing.md },
  noticeText: { ...typography.caption, color: '#C9B6F0' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, height: 56, color: colors.text, fontSize: 22, fontWeight: '700' },
  inputSuffix: { ...typography.bodyStrong, color: colors.textSecondary },
  presets: { flexDirection: 'row', gap: spacing.sm },
  preset: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  presetActive: { color: colors.textInverse, backgroundColor: colors.primary },
  quoteBox: { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  quoteLabel: { ...typography.caption, color: colors.textSecondary },
  quoteValue: { ...typography.caption, color: colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  successBox: { alignItems: 'center', gap: 4 },
  successText: { ...typography.bodyStrong, color: colors.positive },
  link: { ...typography.caption, color: colors.primary, textDecorationLine: 'underline' },
  error: { ...typography.caption, color: colors.negative, textAlign: 'center' },
});
