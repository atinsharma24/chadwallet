import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { TokenRow, TOKEN_ROW_DIVIDER } from '@/components/TokenRow';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { useTrendingTokens } from '@/hooks/useTrendingTokens';
import { TrendingToken } from '@/api/types';
import { RootStackParamList, toTokenDetailsParams } from '@/navigation/types';
import { ENV } from '@/config/env';
import { colors, radius, spacing, typography } from '@/theme';

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
        {/* Search Bar matching design */}
        <View style={styles.searchRow}>
          <View style={styles.iconBtn}>
            <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Tokens, wallets, #tweets"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              editable={false}
            />
            <Ionicons name="copy-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
          </View>
        </View>

        {/* Pill Menu */}
        <View style={styles.pillMenu}>
          <View style={styles.pillItem}>
            <Ionicons name="pulse" size={16} color={colors.textSecondary} />
            <Text style={styles.pillText}>Live</Text>
          </View>
          <View style={styles.pillItem}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.pillText, { color: colors.primary }]}>KOLs</Text>
            <View style={styles.activeIndicator} />
          </View>
          <View style={styles.pillItem}>
            <Text style={styles.pillText}># Memecoin</Text>
          </View>
          <View style={styles.pillItem}>
            <Ionicons name="trending-up" size={16} color={colors.primary} />
            <Text style={[styles.pillText, { color: colors.primary }]}>Trending</Text>
            <View style={styles.activeIndicator} />
          </View>
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
          ItemSeparatorComponent={() => TOKEN_ROW_DIVIDER}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  pillMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
    position: 'relative',
  },
  pillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  listContent: { paddingBottom: spacing.xxl },
});
