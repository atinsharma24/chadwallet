import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/types';
import { useTokenChart, useTokenOverview, useTokenTrades } from '@/hooks/useTokenDetails';
import { ChartRange, TokenTrade } from '@/api/types';
import { TokenLogo } from '@/components/TokenLogo';
import { PriceChart } from '@/components/PriceChart';
import { PercentBadge } from '@/components/PercentBadge';
import { StatCard } from '@/components/StatCard';
import { SwapPanel } from '@/components/SwapPanel';
import { LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { compactNumber, formatUsd, timeAgo } from '@/theme/format';
import { explorerUrl, shortAddress } from '@/lib/solana';

type DetailRoute = RouteProp<RootStackParamList, 'TokenDetails'>;
const RANGES: ChartRange[] = ['1H', '1D', '1W', '1M'];

export function TokenDetailsScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { address, symbol, name, logoURI, seedPrice, seedChange } = route.params;

  const [range, setRange] = useState<ChartRange>('1D');
  const { data: overview, isLoading } = useTokenOverview(address);
  const { data: chart, isLoading: chartLoading } = useTokenChart(address, range);
  const { data: trades } = useTokenTrades(address);

  const price = overview?.price ?? seedPrice ?? 0;
  const change = overview?.priceChange24h ?? seedChange ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <TokenLogo uri={overview?.logoURI ?? logoURI} symbol={symbol} size={26} />
          <Text style={styles.headerTitle}>{symbol}</Text>
        </View>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Price block */}
        <View style={styles.priceBlock}>
          <Text style={styles.name}>{overview?.name ?? name}</Text>
          <Text style={styles.price}>{formatUsd(price)}</Text>
          <PercentBadge value={change} />
        </View>

        {/* Chart */}
        <View style={styles.chartWrap}>
          {chartLoading ? (
            <View style={{ height: 200, justifyContent: 'center' }}>
              <LoadingState label="Loading chart…" />
            </View>
          ) : (
            <PriceChart data={chart} width={width - spacing.lg * 2} height={200} />
          )}
        </View>

        {/* Range selector */}
        <View style={styles.ranges}>
          {RANGES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[styles.rangeBtn, range === r && styles.rangeActive]}
            >
              <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Market Cap" value={formatUsd(overview?.marketCap, { compact: true })} />
          <StatCard label="Volume 24h" value={formatUsd(overview?.volume24h, { compact: true })} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard label="Liquidity" value={formatUsd(overview?.liquidity, { compact: true })} />
          <StatCard
            label="Holders"
            value={overview?.holders ? compactNumber(overview.holders) : '—'}
          />
        </View>

        {/* Swap (bonus) */}
        {overview && <SwapPanel token={overview} />}

        {/* Recent trades */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.tradesCard}>
          {isLoading && !trades ? (
            <LoadingState label="Loading trades…" />
          ) : trades && trades.length > 0 ? (
            trades.slice(0, 15).map((t: TokenTrade, i: number) => (
              <TradeRow key={`${t.txHash}-${i}`} trade={t} />
            ))
          ) : (
            <Text style={styles.noTrades}>No recent trades.</Text>
          )}
        </View>

        <Pressable onPress={() => Linking.openURL(explorerUrl(address, 'address'))}>
          <Text style={styles.contractLink}>Contract: {shortAddress(address, 6)} ↗</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function TradeRow({ trade }: { trade: TokenTrade }) {
  const isBuy = trade.side === 'buy';
  return (
    <Pressable
      style={styles.tradeRow}
      onPress={() => Linking.openURL(explorerUrl(trade.txHash))}
    >
      <View style={[styles.sideTag, { backgroundColor: isBuy ? colors.primaryDim : '#3A1417' }]}>
        <Text style={[styles.sideText, { color: isBuy ? colors.positive : colors.negative }]}>
          {isBuy ? 'BUY' : 'SELL'}
        </Text>
      </View>
      <Text style={styles.tradeOwner}>{shortAddress(trade.owner)}</Text>
      <Text style={styles.tradeAmount}>{formatUsd(trade.volumeUsd, { compact: true })}</Text>
      <Text style={styles.tradeTime}>{timeAgo(trade.unixTime)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 34, color: colors.text, marginTop: -4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  priceBlock: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  name: { ...typography.caption, color: colors.textSecondary },
  price: { ...typography.display, color: colors.text },
  chartWrap: { alignItems: 'center' },
  ranges: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  rangeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  rangeActive: { backgroundColor: colors.primary },
  rangeText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  rangeTextActive: { color: colors.textInverse },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  tradesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sideTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  sideText: { ...typography.micro, fontWeight: '800' },
  tradeOwner: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  tradeAmount: { ...typography.caption, color: colors.text, fontWeight: '700' },
  tradeTime: { ...typography.caption, color: colors.textTertiary, width: 36, textAlign: 'right' },
  noTrades: { ...typography.body, color: colors.textSecondary, padding: spacing.lg, textAlign: 'center' },
  contractLink: { ...typography.caption, color: colors.primary, textAlign: 'center' },
});
