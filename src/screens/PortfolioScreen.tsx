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
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
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
import { formatTokenAmount, formatUsd, timeAgo, formatPercent } from '@/theme/format';
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
      <View style={styles.topSearchRow}>
        <View style={styles.iconBtn}>
          <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search for tokens or wallets"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            editable={false}
          />
          <Ionicons name="copy-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
        </View>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.total}>{formatUsd(portfolio?.totalUsd)}</Text>
        <Pressable style={styles.walletPill} onPress={copyAddress}>
          <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.walletPillText}>{address ? shortAddress(address, 4) : '...'}</Text>
        </Pressable>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.percentPositive}>{formatPercent(100)} Past year</Text>
        <Text style={styles.valueLabel}>Value</Text>
      </View>

      {netWorth.length > 1 && (
        <View style={styles.chart}>
          <PriceChart
            data={netWorth}
            width={width - spacing.lg * 2}
            height={120}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <View style={styles.actionItem}>
          <View style={styles.circleBtn}>
            <Ionicons name="arrow-up" size={24} color={colors.bg} />
          </View>
          <Text style={styles.actionLabel}>Send</Text>
        </View>
        <View style={styles.actionItem}>
          <Pressable style={styles.circleBtn} onPress={() => setShowAddress(true)}>
            <Ionicons name="arrow-down" size={24} color={colors.bg} />
          </Pressable>
          <Text style={styles.actionLabel}>Receive</Text>
        </View>
        <View style={styles.actionItem}>
          <View style={styles.circleBtn}>
            <Ionicons name="download-outline" size={24} color={colors.bg} />
          </View>
          <Text style={styles.actionLabel}>Deposit</Text>
        </View>
        <View style={styles.actionItem}>
          <View style={styles.circleBtn}>
            <Ionicons name="push-outline" size={24} color={colors.bg} />
          </View>
          <Text style={styles.actionLabel}>Withdraw</Text>
        </View>
      </View>

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
    <View style={styles.holdingRowWrapper}>
      <View style={styles.holdingRow}>
        <TokenLogo
          uri={holding.isSol ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' : undefined}
          symbol={holding.isSol ? 'SOL' : symbol}
          size={40}
        />
        <View style={styles.holdingId}>
          <Text style={styles.holdingSymbol}>{holding.isSol ? 'Solana' : 'ChadWallet'}</Text>
          <Text style={styles.holdingAmount}>
            {formatTokenAmount(holding.amount, 1)} {symbol}
          </Text>
        </View>
        <View style={styles.holdingValue}>
          <Text style={styles.holdingUsd}>{formatUsd(holding.valueUsd)}</Text>
        </View>
      </View>
      {!holding.isSol && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          <Button title="Earn Rewards" variant="primary" />
        </View>
      )}
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
    paddingTop: spacing.sm,
    display: 'none', // Hide standard top bar in favor of custom layout
  },
  title: { ...typography.h1, color: colors.text },
  logout: { ...typography.caption, color: colors.textSecondary },
  listContent: { paddingBottom: 120 },
  headerBlock: { paddingHorizontal: spacing.lg, gap: spacing.xs, alignItems: 'stretch' },
  
  topSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 36,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    ...typography.caption,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 6,
  },
  walletPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  percentPositive: {
    ...typography.caption,
    color: colors.positive,
    fontWeight: '600',
  },
  valueLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  total: { ...typography.display, color: colors.text },
  chart: { marginVertical: spacing.md, alignItems: 'center', width: '100%' },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  
  airdrop: { alignSelf: 'stretch', marginTop: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  
  holdingRowWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
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
