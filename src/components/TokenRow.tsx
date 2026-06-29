import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TrendingToken } from '@/api/types';
import { colors, radius, spacing, typography } from '@/theme';
import { formatUsd, compactNumber } from '@/theme/format';
import { useSparkline } from '@/hooks/useSparkline';
import { TokenLogo } from './TokenLogo';
import { Sparkline } from './Sparkline';
import { PercentBadge } from './PercentBadge';

interface Props {
  token: TrendingToken;
  onPress: (token: TrendingToken) => void;
  showSparkline?: boolean;
}

function TokenRowBase({ token, onPress, showSparkline = true }: Props) {
  // Lazy, best-effort sparkline (bonus feature). Falls back to the inline
  // series if the list payload already carried one.
  const { data: spark } = useSparkline(token.address, showSparkline && !token.sparkline);
  const series = token.sparkline ?? spark;

  return (
    <Pressable
      onPress={() => onPress(token)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.rank}>{token.rank ?? '·'}</Text>
      <TokenLogo uri={token.logoURI} symbol={token.symbol} size={40} />

      <View style={styles.idCol}>
        <Text style={styles.symbol} numberOfLines={1}>
          {token.symbol}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Vol {compactNumber(token.volume24h)}
        </Text>
      </View>

      {showSparkline && (
        <View style={styles.spark}>
          <Sparkline data={series} />
        </View>
      )}

      <View style={styles.priceCol}>
        <Text style={styles.price} numberOfLines={1}>
          {formatUsd(token.price)}
        </Text>
        <PercentBadge value={token.priceChange24h} subtle />
      </View>
    </Pressable>
  );
}

export const TokenRow = React.memo(TokenRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  pressed: { backgroundColor: colors.bgElevated },
  rank: {
    ...typography.caption,
    color: colors.textTertiary,
    width: 18,
    textAlign: 'center',
  },
  idCol: { flex: 1, minWidth: 0, gap: 2 },
  symbol: { ...typography.bodyStrong, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
  spark: { width: 72, alignItems: 'center', justifyContent: 'center' },
  priceCol: { alignItems: 'flex-end', gap: 2, minWidth: 84 },
  price: { ...typography.bodyStrong, color: colors.text },
});

export const TOKEN_ROW_DIVIDER = (
  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 72 }} />
);
