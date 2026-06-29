import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/theme';
import { formatPercent } from '@/theme/format';

export function PercentBadge({ value, subtle }: { value?: number | null; subtle?: boolean }) {
  const positive = (value ?? 0) >= 0;
  const tint = positive ? colors.positive : colors.negative;
  if (subtle) {
    return <Text style={[styles.subtle, { color: tint }]}>{formatPercent(value)}</Text>;
  }
  return (
    <View style={[styles.badge, { backgroundColor: positive ? colors.primaryDim : '#3A1417' }]}>
      <Text style={[styles.text, { color: tint }]}>{formatPercent(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, fontWeight: '700' },
  subtle: { ...typography.caption, fontWeight: '700' },
});
