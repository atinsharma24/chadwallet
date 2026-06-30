import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.muted}>{message ?? 'Please try again.'}</Text>
      {onRetry && (
        <Button title="Retry" variant="secondary" onPress={onRetry} style={styles.retry} />
      )}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.muted}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text, textAlign: 'center' },
  muted: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: spacing.md, minWidth: 140 },
});
