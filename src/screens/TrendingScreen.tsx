import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { TokenRow } from '@/components/TokenRow';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { useTrendingTokens } from '@/hooks/useTrendingTokens';
import { TrendingToken } from '@/api/types';
import { RootStackParamList, toTokenDetailsParams } from '@/navigation/types';
import { ENV } from '@/config/env';
import { colors, spacing, typography } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TrendingScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, error, refetch } = useTrendingTokens();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openToken = useCallback(
    (token: TrendingToken) => {
      navigation.navigate('TokenDetails', toTokenDetailsParams(token));
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: TrendingToken }) => <TokenRow token={item} onPress={openToken} />,
    [openToken],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trending</Text>
          <Text style={styles.subtitle}>Hottest Solana memecoins right now</Text>
        </View>
        <View style={styles.netPill}>
          <View style={[styles.dot, { backgroundColor: ENV.isMainnet ? colors.positive : colors.warning }]} />
          <Text style={styles.netText}>{ENV.isMainnet ? 'Mainnet' : 'Devnet'}</Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingState label="Loading trending tokens…" />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(t) => t.address}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState title="No tokens found" subtitle="Pull down to refresh." />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  netPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  netText: { ...typography.micro, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 72 },
  listContent: { paddingBottom: spacing.xxl },
});
