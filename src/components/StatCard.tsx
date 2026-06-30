import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  label: string;
  value: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  label: { ...typography.micro, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { ...typography.h3, color: colors.text },
});
