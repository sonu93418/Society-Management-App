import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface InteractiveLogoProps {
  size?: number;
  darkBackground?: boolean;
}

export function InteractiveLogo({ size = 80, darkBackground = false }: InteractiveLogoProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeService, setActiveService] = useState<string | null>(null);

  // Animation shared values
  const scale = useSharedValue(1);
  const rotationVal = useSharedValue(0);
  const servicesScale = useSharedValue(0);

  const nodeSize = 44;
  const centerPos = (size - nodeSize) / 2;

  const services = [
    {
      id: 'security',
      name: 'Smart Gate',
      desc: 'Pre-approve guests & delivery executive alerts.',
      icon: 'shield-checkmark-outline' as const,
      color: Colors.primary,
      offsetX: -60,
      offsetY: -60,
    },
    {
      id: 'community',
      name: 'Live Polls',
      desc: 'Vote on decisions and read society broadcasts.',
      icon: 'megaphone-outline' as const,
      color: Colors.warning,
      offsetX: 60,
      offsetY: -60,
    },
    {
      id: 'payments',
      name: 'Payments',
      desc: 'Pay maintenance bills and amenities securely.',
      icon: 'card-outline' as const,
      color: Colors.success,
      offsetX: -60,
      offsetY: 60,
    },
    {
      id: 'helpdesk',
      name: 'Helpdesk',
      desc: 'Raise plumbing, electrical or service tickets.',
      icon: 'construct-outline' as const,
      color: '#0284C7',
      offsetX: 60,
      offsetY: 60,
    },
  ];

  const triggerHaptic = (type: 'medium' | 'success') => {
    if (Platform.OS !== 'web') {
      try {
        if (type === 'medium') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        console.warn('Haptics not supported', err);
      }
    }
  };

  const handleLogoPress = () => {
    triggerHaptic('medium');

    // Bounce and spin Reanimated values
    scale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    rotationVal.value = withSequence(
      withTiming(expanded ? 0 : 45, { duration: 200 }),
      withTiming(expanded ? 0 : 0, { duration: 100 })
    );

    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    servicesScale.value = withSpring(nextExpanded ? 1 : 0, {
      damping: 12,
      stiffness: 120,
    });

    if (!nextExpanded) {
      setActiveService(null);
    }
  };

  const handleServicePress = (serviceId: string) => {
    triggerHaptic('success');
    setActiveService(activeService === serviceId ? null : serviceId);
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotationVal.value}deg` }
      ],
    };
  });

  const getServiceAnimatedStyle = (offsetX: number, offsetY: number) => {
    return useAnimatedStyle(() => {
      return {
        transform: [
          { scale: servicesScale.value },
          { translateX: withSpring(expanded ? offsetX : 0, { damping: 10, stiffness: 100 }) },
          { translateY: withSpring(expanded ? offsetY : 0, { damping: 10, stiffness: 100 }) },
        ],
        opacity: servicesScale.value,
      };
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* Tooltip box above the logo */}
      <View style={styles.tooltipHeightConstraint}>
        {activeService && (
          <Animated.View style={styles.tooltipContainer}>
            <Text style={styles.tooltipTitle}>
              {services.find((s) => s.id === activeService)?.name}
            </Text>
            <Text style={styles.tooltipDesc}>
              {services.find((s) => s.id === activeService)?.desc}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={[styles.container, { width: size, height: size }]}>
        {/* Floating service icons */}
        {services.map((svc) => (
          <Animated.View
            key={svc.id}
            style={[
              styles.serviceNode,
              {
                width: nodeSize,
                height: nodeSize,
                borderRadius: nodeSize / 2,
                left: centerPos,
                top: centerPos,
                backgroundColor: activeService === svc.id ? svc.color : Colors.white,
                borderColor: svc.color,
              },
              getServiceAnimatedStyle(svc.offsetX, svc.offsetY),
            ]}
          >
            <Pressable
              onPress={() => handleServicePress(svc.id)}
              style={styles.nodePressable}
            >
              <Ionicons
                name={svc.icon}
                size={20}
                color={activeService === svc.id ? Colors.white : svc.color}
              />
            </Pressable>
          </Animated.View>
        ))}

        {/* Central Brand Logo Badge */}
        <Animated.View style={[styles.logoCoreContainer, logoAnimatedStyle]}>
          <Pressable
            onPress={handleLogoPress}
            style={[
              styles.logoPressable,
              {
                width: size,
                height: size,
                borderRadius: size * 0.35,
                backgroundColor: Colors.primary,
              },
            ]}
          >
            {/* The Logical Vector Logo combining 'P', 'Gateway Gate', and 'Security Key' */}
            <View style={styles.vectorLogoContainer}>
              {/* Left Pillar of the Gateway */}
              <View style={styles.logoPillar} />
              
              {/* Right Arc forming the letter 'P' shape and Gateway Arch */}
              <View style={styles.logoArch} />
              
              {/* Small lock/security key indicator */}
              <View style={styles.logoKeyhole}>
                <Ionicons name="key" size={size * 0.22} color={Colors.white} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      <Text style={[styles.interactionHint, darkBackground && styles.interactionHintDark]}>
        {expanded ? 'Tap service icons to learn more' : 'Tap logo to reveal smart services'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible', // Essential for fanned nodes to render outside bounds
  },
  logoCoreContainer: {
    zIndex: 10,
    ...Shadows.lg,
  },
  logoPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  vectorLogoContainer: {
    width: '60%',
    height: '60%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPillar: {
    width: 6,
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
    position: 'absolute',
    left: '15%',
  },
  logoArch: {
    width: '65%',
    height: '60%',
    borderWidth: 6,
    borderColor: Colors.white,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    position: 'absolute',
    right: '10%',
    top: 0,
  },
  logoKeyhole: {
    position: 'absolute',
    bottom: -2,
    right: '15%',
    opacity: 0.9,
  },
  serviceNode: {
    borderWidth: 2,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    ...Shadows.md,
  },
  nodePressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipHeightConstraint: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tooltipContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    width: 280,
    zIndex: 20,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tooltipTitle: {
    ...Typography.captionMedium,
    color: Colors.white,
    fontWeight: '700',
    marginBottom: 1,
  },
  tooltipDesc: {
    ...Typography.caption,
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 11,
  },
  interactionHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  interactionHintDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
