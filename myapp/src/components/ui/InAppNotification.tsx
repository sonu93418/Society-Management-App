import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontFamily } from '../../theme';

export interface InAppNotificationData {
  title: string;
  body: string;
  category: 'visitor' | 'complaint' | 'notice' | 'booking' | 'payment' | 'poll' | 'emergency' | 'general';
  data?: Record<string, string>;
}

interface InAppNotificationContextType {
  showInAppNotification: (notification: InAppNotificationData) => void;
}

const InAppNotificationContext = createContext<InAppNotificationContextType | undefined>(undefined);

export const useInAppNotification = () => {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error('useInAppNotification must be used within an InAppNotificationProvider');
  }
  return context;
};

const { width } = Dimensions.get('window');

const CATEGORY_STYLES = {
  visitor: { icon: 'people-outline', color: '#6366F1', label: 'Visitor Request' },
  complaint: { icon: 'hammer-outline', color: '#EF4444', label: 'Helpdesk' },
  notice: { icon: 'megaphone-outline', color: '#3B82F6', label: 'Announcement' },
  booking: { icon: 'calendar-outline', color: '#8B5CF6', label: 'Amenity Booking' },
  payment: { icon: 'card-outline', color: '#10B981', label: 'Payments' },
  poll: { icon: 'checkbox-outline', color: '#06B6D4', label: 'Community Poll' },
  emergency: { icon: 'warning-outline', color: '#DC2626', label: 'EMERGENCY' },
  general: { icon: 'notifications-outline', color: '#4F46E5', label: 'Notification' },
} as const;

export const InAppNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNotification, setActiveNotification] = useState<InAppNotificationData | null>(null);
  
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showInAppNotification = (notification: InAppNotificationData) => {
    // 1. Trigger tactile haptics & vibration
    if (notification.category === 'emergency') {
      Vibration.vibrate([0, 400, 200, 400]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // 2. Set current active notification
    setActiveNotification(notification);

    // 3. Clear any existing auto-dismiss timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 4. Reset progress bar and animate sliding down
    progressAnim.setValue(1);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 30,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 5500,
        useNativeDriver: false, // width/interpolations on non-transform props must use false
      }),
    ]).start();

    // 5. Configure 5.5 second auto-dismiss
    timeoutRef.current = setTimeout(() => {
      dismissNotification();
    }, 5500);
  };

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveNotification(null);
    });
  };

  const handleTap = () => {
    if (!activeNotification) return;

    const { category, data = {} } = activeNotification;
    const ticketId = data.ticketId;
    
    // Perform redirection based on category
    if (category === 'visitor') {
      router.push('/(resident)/visitors');
    } else if (category === 'complaint') {
      if (ticketId) {
        router.push(`/(resident)/helpdesk/${ticketId}`);
      } else {
        router.push('/(resident)/helpdesk');
      }
    } else if (category === 'notice') {
      router.push('/(resident)/notices');
    } else if (category === 'poll') {
      router.push('/(resident)/polls');
    } else if (category === 'booking') {
      router.push('/(resident)/amenities');
    } else if (category === 'payment') {
      router.push('/(resident)/payments');
    } else {
      router.push('/(resident)');
    }

    dismissNotification();
  };

  const categoryStyle = activeNotification
    ? CATEGORY_STYLES[activeNotification.category] || CATEGORY_STYLES.general
    : CATEGORY_STYLES.general;

  return (
    <InAppNotificationContext.Provider value={{ showInAppNotification }}>
      {children}
      {activeNotification && (
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleTap}
            style={[
              styles.card,
              activeNotification.category === 'emergency' && styles.emergencyCard,
            ]}
          >
            <View style={styles.cardContent}>
              {/* Category Icon */}
              <View style={[styles.iconContainer, { backgroundColor: categoryStyle.color + '15' }]}>
                <Ionicons name={categoryStyle.icon} size={20} color={categoryStyle.color} />
              </View>

              {/* Text Fields */}
              <View style={styles.textContainer}>
                <View style={styles.metaRow}>
                  <Text style={[styles.categoryLabel, { color: categoryStyle.color }]}>
                    {categoryStyle.label.toUpperCase()}
                  </Text>
                  <Text style={styles.timeLabel}>just now</Text>
                </View>
                <Text style={styles.titleText} numberOfLines={1}>
                  {activeNotification.title}
                </Text>
                <Text style={styles.bodyText} numberOfLines={2}>
                  {activeNotification.body}
                </Text>
              </View>

              {/* Compact Close Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  dismissNotification();
                }}
                style={styles.closeIconButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Micro-animated countdown progress bar */}
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: categoryStyle.color,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </InAppNotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 99999,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    
    // Premium shadow
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    shadowColor: '#EF4444',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  titleText: {
    fontSize: 13.5,
    color: Colors.text,
    fontWeight: '700',
    fontFamily: FontFamily.semibold,
    marginBottom: 1,
  },
  bodyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
  },
  closeIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.03)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
});
