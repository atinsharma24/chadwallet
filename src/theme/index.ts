// ChadWallet design tokens.
// Dark, high-contrast memecoin-trading aesthetic with Solana-inspired
// green/purple accents. Swap these hexes for the exact brand values from the
// asset folder when available (see SETUP.md > Branding).

export const colors = {
  // Surfaces
  bg: '#000000',
  bgElevated: '#111317',
  surface: '#16191F',
  surfaceAlt: '#1C2027',
  border: '#23262D',
  borderStrong: '#2E333C',

  // Brand accents
  primary: '#00E599', // Chad green (gains / CTA)
  primaryDim: '#0B3D30',
  secondary: '#9945FF', // Solana purple
  secondaryDim: '#2A1A47',

  // Semantic
  positive: '#16C784',
  negative: '#EA3943',
  warning: '#F0B90B',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9AA0AA',
  textTertiary: '#5B616B',
  textInverse: '#06241B',

  // Misc
  overlay: 'rgba(0,0,0,0.6)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '700' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  mono: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const theme = { colors, spacing, radius, typography, shadow };
export type Theme = typeof theme;
