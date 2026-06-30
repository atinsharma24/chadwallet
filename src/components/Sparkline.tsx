import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

interface Props {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
}

// Minimal, dependency-light sparkline. Renders nothing until at least two
// points exist so trending rows never show a broken stub.
export function Sparkline({ data, width = 72, height = 28, color }: Props) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!path) return <View style={{ width, height }} />;

  const trendUp = (data as number[])[data!.length - 1] >= (data as number[])[0];
  const stroke = color ?? (trendUp ? colors.positive : colors.negative);

  return (
    <Svg width={width} height={height}>
      <Path d={path} stroke={stroke} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}
