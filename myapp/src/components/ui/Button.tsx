import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getGradientColors = (): readonly [string, string] | null => {
    if (variant === 'primary') return Colors.gradient.primary;
    if (variant === 'success') return Colors.gradient.success;
    if (variant === 'danger') return Colors.gradient.danger;
    return null;
  };

  const gradientColors = getGradientColors();

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost' || variant === 'secondary'
              ? Colors.primary
              : Colors.white
          }
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}
        >
          {title}
        </Text>
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </View>
    );
  };

  // If variant uses gradient, we wrap the inside with LinearGradient
  if (gradientColors && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.base,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientBg, styles[`size_${size}`]]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  gradientBg: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.border,
    ...Shadows.none,
  },

  // Non-gradient variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.primaryGhost,
    ...Shadows.none,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Shadows.none,
  },
  ghost: {
    backgroundColor: 'transparent',
    ...Shadows.none,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  success: {
    backgroundColor: Colors.success,
  },

  // Sizes (paddings)
  size_sm: {
    paddingVertical: Spacing.sm + 1,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  size_md: {
    paddingVertical: Spacing.md + 1,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    paddingVertical: Spacing.lg - 1,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
  },

  // Text styles
  text: {
    ...Typography.button,
    textAlign: 'center',
    fontWeight: '700',
  },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.primary },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  text_danger: { color: Colors.white },
  text_success: { color: Colors.white },

  textSize_sm: { ...Typography.buttonSm },
  textSize_md: { ...Typography.button },
  textSize_lg: { ...Typography.button, fontSize: 16 },

  // Icons padding
  iconLeft: { marginRight: Spacing.xs + 2 },
  iconRight: { marginLeft: Spacing.xs + 2 },
});
