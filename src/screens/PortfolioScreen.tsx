import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { TokenLogo } from '@/components/TokenLogo';
import { PriceChart } from '@/components/PriceChart';
import { Button } from '@/components/Button';
import { LoadingState, EmptyState } from '@/components/States';
import { useWallet } from '@/hooks/useWallet';
import { usePortfolio, useActivity } from '@/hooks/usePortfolio';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { Holding, requestDevnetAirdrop } from '@/api/portfolio';
import { ENV } from '@/config/env';
import { explorerUrl, shortAddress } from '@/lib/solana';
import { colors, radius, spacing, typography } from '@/theme';
import { formatTokenAmount, formatUsd, timeAgo } from '@/theme/format';
import { Linking } from 'react-native';

export function PortfolioScreen() {
  const { address, logout, ensureWallet } = useWallet();
  const { width } = useWindowDimensions();
  const { data: portfolio, isLoading, refetch } = usePortfolio(address);
  const { data: activity } = useActivity(address);
  const netWorth = useNetWorthHistory(address, portfolio?.totalUsd);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [airdropping, setAirdropping] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([ensureWallet(), refetch()]);
    setRefreshing(false);
  }, [refetch, ensureWallet]);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
  }, [address]);

  const handleAirdrop = useCallback(async () => {
    if (!address) return;
    setAirdropping(true);
    try {
      await requestDevnetAirdrop(address);
      await refetch();
      Alert.alert('Airdrop complete', '1 SOL added to your Devnet wallet.');
    } catch (e) {
      Alert.alert('Airdrop failed', (e as Error).message);
    } finally {
      setAirdropping(false);
    }
  }, [address, refetch]);

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.eyebrow}>Net Worth</Text>
      <Text style={styles.total}>{formatUsd(portfolio?.totalUsd)}</Text>
      <Text style={styles.solLine}>
        {formatTokenAmount(portfolio?.solBalance, 4)} SOL
      </Text>

      {netWorth.length > 1 && (
        <View style={styles.chart}>
          <PriceChart
            data={netWorth}
            width={width - spacing.lg * 2}
            height={120}
          />
        </View>
      )}

      {!ENV.isMainnet && (
        <Button
          title={airdropping ? 'Requesting…' : 'Request 1 SOL (Devnet Airdrop)'}
          variant="secondary"
          onPress={handleAirdrop}
          loading={airdropping}
          style={styles.airdrop}
        />
      )}

      <Text style={styles.sectionTitle}>Holdings</Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text style={styles.title}>Portfolio</Text>
        <Pressable onPress={() => logout()} hitSlop={8}>
          <Text style={styles.logout}>Sign out</Text>
        </Pressable>
      </View>

      {isLoading && !portfolio ? (
        <LoadingState label="Loading your portfolio…" />
      ) : (
        <FlatList
          data={portfolio?.holdings ?? []}
          keyExtractor={(h) => h.mint}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <HoldingRow holding={item} />}
          ListFooterComponent={<ActivitySection activity={activity} />}
          ListEmptyComponent={
            <EmptyState title="No holdings yet" subtitle="Your tokens will appear here." />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB: reveal wallet address */}
      <Pressable style={styles.fab} onPress={() => setShowAddress(true)}>
        <Text style={styles.fabIcon}>⌁</Text>
        <Text style={styles.fabLabel}>Receive</Text>
      </Pressable>

      <Modal
        visible={showAddress}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddress(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddress(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Your Wallet Address</Text>
            <Text style={styles.sheetSub}>
              Send SOL or SPL tokens to this address on {ENV.isMainnet ? 'Mainnet' : 'Devnet'}.
            </Text>
            <View style={styles.addressBox}>
              <Text style={styles.addressText} selectable>
                {address ?? '—'}
              </Text>
            </View>
            <Button title="Copy Address" onPress={copyAddress} />
            <Pressable
              onPress={() => address && Linking.openURL(explorerUrl(address, 'address'))}
            >
              <Text style={styles.explorerLink}>View on Solscan ↗</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function HoldingRow({ holding }: { holding: Holding }) {
  const symbol = holding.isSol ? 'SOL' : shortAddress(holding.mint, 4);
  return (
    <View style={styles.holdingRow}>
      <TokenLogo
        uri={holding.isSol ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' : undefined}
        symbol={holding.isSol ? 'SOL' : symbol}
        size={38}
      />
      <View style={styles.holdingId}>
        <Text style={styles.holdingSymbol}>{symbol}</Text>
        <Text style={styles.holdingAmount}>
          {formatTokenAmount(holding.amount, 4)} tokens
        </Text>
      </View>
      <View style={styles.holdingValue}>
        <Text style={styles.holdingUsd}>{formatUsd(holding.valueUsd)}</Text>
        <Text style={styles.holdingPrice}>{formatUsd(holding.priceUsd)}</Text>
      </View>
    </View>
  );
}

function ActivitySection({
  activity,
}: {
  activity?: { signature: string; blockTime: number | null; err: boolean }[];
}) {
  if (!activity || activity.length === 0) return null;
  return (
    <View style={styles.activityWrap}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.activityCard}>
        {activity.slice(0, 12).map((a) => (
          <Pressable
            key={a.signature}
            style={styles.activityRow}
            onPress={() => Linking.openURL(explorerUrl(a.signature))}
          >
            <View
              style={[
                styles.activityDot,
                { backgroundColor: a.err ? colors.negative : colors.positive },
              ]}
            />
            <Text style={styles.activitySig}>{shortAddress(a.signature, 6)}</Text>
            <Text style={styles.activityTime}>
              {a.blockTime ? timeAgo(a.blockTime) : '—'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: { ...typography.h1, color: colors.text },
  logout: { ...typography.caption, color: colors.textSecondary },
  listContent: { paddingBottom: 120 },
  headerBlock: { paddingHorizontal: spacing.lg, gap: spacing.xs, alignItems: 'flex-start' },
  eyebrow: { ...typography.micro, color: colors.textSecondary, textTransform: 'uppercase' },
  total: { ...typography.display, color: colors.text },
  solLine: { ...typography.body, color: colors.textSecondary },
  chart: { marginVertical: spacing.md, alignItems: 'center', width: '100%' },
  airdrop: { alignSelf: 'stretch', marginTop: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  holdingId: { flex: 1, gap: 2 },
  holdingSymbol: { ...typography.bodyStrong, color: colors.text },
  holdingAmount: { ...typography.caption, color: colors.textSecondary },
  holdingValue: { alignItems: 'flex-end', gap: 2 },
  holdingUsd: { ...typography.bodyStrong, color: colors.text },
  holdingPrice: { ...typography.caption, color: colors.textSecondary },
  activityWrap: { paddingHorizontal: spacing.lg },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activitySig: { ...typography.caption, color: colors.text, flex: 1 },
  activityTime: { ...typography.caption, color: colors.textTertiary },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: radius.pill,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabIcon: { fontSize: 20, color: colors.textInverse, fontWeight: '900' },
  fabLabel: { ...typography.bodyStrong, color: colors.textInverse },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h2, color: colors.text },
  sheetSub: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  addressBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    width: '100%',
  },
  addressText: { ...typography.mono, color: colors.text, textAlign: 'center' },
  explorerLink: { ...typography.caption, color: colors.primary },
});
