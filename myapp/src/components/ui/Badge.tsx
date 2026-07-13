import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type BadgeVariant = 'pending' | 'approved' | 'rejected' | 'inside' | 'exited' |
                    'open' | 'in_progress' | 'resolved' | 'closed' |
                    'paid' | 'overdue' | 'confirmed' | 'cancelled' |
                    'guest' | 'delivery' | 'cab' | 'service' |
                    'low' | 'medium' | 'high' | 'urgent' |
                    'info' | 'success' | 'warning' | 'danger';

const variantColors: Record<string, { bg: string; text: string }> = {
  // Visitor status
  pending: { bg: Colors.warningLight, text: Colors.warningDark },
  approved: { bg: Colors.successLight, text: Colors.successDark },
  rejected: { bg: Colors.dangerLight, text: Colors.dangerDark },
  inside: { bg: Colors.infoLight, text: '#2563EB' },
  exited: { bg: '#F1F5F9', text: '#64748B' },
  expired: { bg: '#F1F5F9', text: '#94A3B8' },

  // Ticket status
  open: { bg: Colors.warningLight, text: Colors.warningDark },
  in_progress: { bg: Colors.infoLight, text: '#2563EB' },
  resolved: { bg: Colors.successLight, text: Colors.successDark },
  closed: { bg: '#F1F5F9', text: '#64748B' },

  // Payment
  paid: { bg: Colors.successLight, text: Colors.successDark },
  overdue: { bg: Colors.dangerLight, text: Colors.dangerDark },

  // Booking
  confirmed: { bg: Colors.successLight, text: Colors.successDark },
  cancelled: { bg: Colors.dangerLight, text: Colors.dangerDark },

  // Visitor types
  guest: { bg: 'rgba(139, 92, 246, 0.12)', text: '#7C3AED' },
  delivery: { bg: Colors.warningLight, text: Colors.warningDark },
  cab: { bg: Colors.infoLight, text: '#2563EB' },
  service: { bg: Colors.successLight, text: Colors.successDark },

  // Priority
  low: { bg: '#F1F5F9', text: '#64748B' },
  medium: { bg: Colors.warningLight, text: Colors.warningDark },
  high: { bg: 'rgba(249, 115, 22, 0.12)', text: '#EA580C' },
  urgent: { bg: Colors.dangerLight, text: Colors.dangerDark },

  // Generic
  info: { bg: Colors.infoLight, text: '#2563EB' },
  success: { bg: Colors.successLight, text: Colors.successDark },
  warning: { bg: Colors.warningLight, text: Colors.warningDark },
  danger: { bg: Colors.dangerLight, text: Colors.dangerDark },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  size = 'sm',
  style,
  dot = false,
}) => {
  const colors = variantColors[variant] || variantColors.info;
  const displayLabel = label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={[styles.base, { backgroundColor: colors.bg }, styles[size], style]}>
      {dot && <View style={[styles.dot, { backgroundColor: colors.text }]} />}
      <Text style={[styles.text, { color: colors.text }, size === 'sm' && styles.textSm]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
  },
  sm: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm + 2,
  },
  md: {
    paddingVertical: Spacing.xs + 1,
    paddingHorizontal: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.captionMedium,
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
    lineHeight: 14,
  },
});
