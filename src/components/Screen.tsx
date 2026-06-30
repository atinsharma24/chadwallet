import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, edges = ['top'], padded = false, style }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});
