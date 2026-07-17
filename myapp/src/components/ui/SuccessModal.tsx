import React, { createContext, useContext, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface SuccessOptions {
  title: string;
  message: string;
  taskType?: 'ticket_resolved' | 'ticket_created' | 'booking_success' | 'flat_assigned' | 'visitor_approved' | 'poll_voted' | 'general';
  details?: { label: string; value: string }[];
  onConfirm?: () => void;
  confirmText?: string;
}

interface SuccessModalContextType {
  showSuccess: (options: SuccessOptions) => void;
}

const SuccessModalContext = createContext<SuccessModalContextType | undefined>(undefined);

export const useSuccessModal = () => {
  const context = useContext(SuccessModalContext);
  if (!context) {
    throw new Error('useSuccessModal must be used within a SuccessModalProvider');
  }
  return context;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SuccessModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<SuccessOptions | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showSuccess = (opts: SuccessOptions) => {
    setOptions(opts);
    setVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (options?.onConfirm) {
        options.onConfirm();
      }
      setOptions(null);
    });
  };

  // Helper to pick icons
  const getIcon = () => {
    switch (options?.taskType) {
      case 'ticket_resolved':
        return { name: 'checkmark-circle-sharp' as const, color: Colors.success, bg: Colors.successLight };
      case 'ticket_created':
        return { name: 'document-text-sharp' as const, color: Colors.info, bg: Colors.infoLight };
      case 'booking_success':
        return { name: 'calendar-sharp' as const, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' };
      case 'flat_assigned':
        return { name: 'home-sharp' as const, color: Colors.primary, bg: Colors.primaryGhost };
      case 'visitor_approved':
        return { name: 'people-sharp' as const, color: Colors.warningDark, bg: Colors.warningLight };
      case 'poll_voted':
        return { name: 'ribbon-sharp' as const, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
      default:
        return { name: 'checkmark-sharp' as const, color: Colors.success, bg: Colors.successLight };
    }
  };

  const iconInfo = getIcon();

  return (
    <SuccessModalContext.Provider value={{ showSuccess }}>
      {children}
      {visible && options && (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
          <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
            
            <Animated.View
              style={[
                styles.alertBox,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Dynamic Icon */}
              <View style={[styles.iconWrapper, { backgroundColor: iconInfo.bg }]}>
                <Ionicons name={iconInfo.name} size={40} color={iconInfo.color} />
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{options.title}</Text>
              <Text style={styles.message}>{options.message}</Text>

              {/* Action/Task Details */}
              {options.details && options.details.length > 0 && (
                <View style={styles.detailsContainer}>
                  {options.details.map((detail, idx) => (
                    <View key={idx} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{options.confirmText || 'Great, got it!'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SuccessModalContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  alertBox: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
    elevation: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    ...Typography.captionMedium,
    color: Colors.text,
    fontWeight: '700',
    maxWidth: '65%',
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
