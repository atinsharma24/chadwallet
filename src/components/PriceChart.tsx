import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { PricePoint } from '@/api/types';
import { colors, radius } from '@/theme';

interface Props {
  data?: PricePoint[];
  width: number;
  height?: number;
}

// Filled area + line chart built on react-native-svg. Derives an up/down tint
// from the first vs last close.
export function PriceChart({ data, width, height = 200 }: Props) {
  const { linePath, areaPath, up } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: null, areaPath: null, up: true };
    }
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pad = 8;
    const usableH = height - pad * 2;

    const coords = data.map((d, i) => {
      const x = i * stepX;
      const y = pad + (usableH - ((d.value - min) / range) * usableH);
      return { x, y };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
      .join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;

    return { linePath: line, areaPath: area, up: values[values.length - 1] >= values[0] };
  }, [data, width, height]);

  const tint = up ? colors.positive : colors.negative;

  if (!linePath) {
    return <View style={[styles.empty, { width, height }]} />;
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tint} stopOpacity={0.28} />
          <Stop offset="1" stopColor={tint} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath as string} fill="url(#areaFill)" />
      <Path d={linePath} stroke={tint} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
});
