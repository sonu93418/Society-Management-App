import { Platform } from 'react-native';

// Claymorphism-inspired shadow system
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: { elevation: 1 },
  }) as object,

  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: { elevation: 2 },
  }) as object,

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: { elevation: 4 },
  }) as object,

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: { elevation: 8 },
  }) as object,

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
    },
    android: { elevation: 12 },
    default: { elevation: 12 },
  }) as object,

  // Card shadow — claymorphism style
  card: Platform.select({
    ios: {
      shadowColor: 'rgba(79, 70, 229, 0.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: { elevation: 4 },
  }) as object,

  // Floating action button shadow
  fab: Platform.select({
    ios: {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: { elevation: 10 },
  }) as object,
} as const;
