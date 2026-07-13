import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'colored';
  color?: string;
  padding?: keyof typeof Spacing;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  color,
  padding = 'lg',
  noPadding = false,
}) => {
  return (
    <View
      style={[
        styles.base,
        !noPadding && { padding: Spacing[padding] },
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'colored' && color ? { backgroundColor: color } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius['3xl'],
    ...Shadows.card,
  },
  elevated: {
    ...Shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.none,
  },
});
