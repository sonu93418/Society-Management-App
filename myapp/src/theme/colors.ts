export const Colors = {
  // Primary palette
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  primaryGhost: 'rgba(79, 70, 229, 0.08)',
  primarySoft: 'rgba(79, 70, 229, 0.15)',

  // Secondary
  secondary: '#6366F1',
  secondaryLight: '#818CF8',

  // Status colors
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.12)',
  successDark: '#059669',
  
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.12)',
  dangerDark: '#DC2626',

  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  warningDark: '#D97706',

  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.12)',

  // Neutrals — Light mode
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Text — Light mode
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Dark mode
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    card: '#1E293B',
    border: '#334155',
    borderLight: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
  },

  // Visitor type colors
  visitor: {
    guest: '#8B5CF6',
    delivery: '#F59E0B',
    cab: '#3B82F6',
    service: '#10B981',
  },

  // Status badge colors
  status: {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    inside: '#3B82F6',
    exited: '#94A3B8',
    expired: '#6B7280',
  },

  // Gradient pairs
  gradient: {
    primary: ['#4F46E5', '#6366F1'] as const,
    success: ['#10B981', '#34D399'] as const,
    danger: ['#EF4444', '#F87171'] as const,
    warning: ['#F59E0B', '#FBBF24'] as const,
    purple: ['#8B5CF6', '#A78BFA'] as const,
    blue: ['#3B82F6', '#60A5FA'] as const,
    dark: ['#1E293B', '#334155'] as const,
  },

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorScheme = typeof Colors;
