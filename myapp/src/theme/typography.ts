import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  semibold: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  xs: 16,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 38,
  '4xl': 44,
  '5xl': 56,
} as const;

export const Typography = {
  h1: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight['4xl'],
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight['3xl'],
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight['2xl'],
  },
  h4: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.xl,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.md,
  },
  bodyMedium: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.md,
  },
  bodySm: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.sm,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.xs,
  },
  captionMedium: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.xs,
  },
  button: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.md,
    letterSpacing: 0.3,
  },
  buttonSm: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.sm,
  },
} as const;
