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

    // 4. Animate sliding down from top
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 50 : 20,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 5. Configure 5 second auto-dismiss
    timeoutRef.current = setTimeout(() => {
      dismissNotification();
    }, 5500);
  };

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
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
            activeOpacity={0.92}
            onPress={handleTap}
            style={[
              styles.card,
              activeNotification.category === 'emergency' && styles.emergencyCard,
            ]}
          >
            {/* Soft inner glow line simulated by top border */}
            <View style={styles.cardHeaderGlow} />

            <View style={styles.cardContent}>
              {/* Category Icon */}
              <View style={[styles.iconContainer, { backgroundColor: categoryStyle.color + '18' }]}>
                <Ionicons name={categoryStyle.icon} size={22} color={categoryStyle.color} />
              </View>

              {/* Text Fields */}
              <View style={styles.textContainer}>
                <View style={styles.metaRow}>
                  <Text style={[styles.categoryLabel, { color: categoryStyle.color }]}>
                    {categoryStyle.label.toUpperCase()}
                  </Text>
                  <Text style={styles.timeLabel}>Just now</Text>
                </View>
                <Text style={styles.titleText} numberOfLines={1}>
                  {activeNotification.title}
                </Text>
                <Text style={styles.bodyText} numberOfLines={2}>
                  {activeNotification.body}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleTap} style={styles.actionBtn}>
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>View Details</Text>
              </TouchableOpacity>
              <View style={styles.separator} />
              <TouchableOpacity onPress={dismissNotification} style={styles.actionBtn}>
                <Text style={styles.closeBtnText}>Dismiss</Text>
              </TouchableOpacity>
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
    // Claymorphism: soft, transparent light background with inner light highlights and deep outer drop shadow
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.50)',
    overflow: 'hidden',
    
    // Outer shadow
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  emergencyCard: {
    backgroundColor: 'rgba(254, 242, 242, 0.95)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#EF4444',
  },
  cardHeaderGlow: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  titleText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: FontFamily.semibold,
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 16,
    fontFamily: FontFamily.regular,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.5)',
    height: 42,
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  separator: {
    width: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
  },
});
