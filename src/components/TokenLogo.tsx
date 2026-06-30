import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/theme';

interface Props {
  uri?: string;
  symbol: string;
  size?: number;
}

export function TokenLogo({ uri, symbol, size = 40 }: Props) {
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (!uri || failed) {
    return (
      <View style={[styles.fallback, dimension]}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {symbol?.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.image, dimension]}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: { ...typography.bodyStrong, color: colors.textSecondary },
});
