import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Button } from '../../components/ui/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Portl',
    description: 'Manage your home and stay connected with your community on India\'s most premium society management portal.',
    image: require('../../../assets/images/splash_poster.png'),
    accent: Colors.primary,
  },
  {
    id: '2',
    title: 'Smart Gate Security',
    description: 'Pre-approve guests, register delivery executives, and get real-time notification alerts on guest arrival.',
    image: require('../../../assets/images/splash_security.png'),
    accent: '#4F46E5',
  },
  {
    id: '3',
    title: 'Notices & Live Polls',
    description: 'Stay updated with official broadcasts and cast your vote on community decisions in real time.',
    image: require('../../../assets/images/splash_community.png'),
    accent: Colors.warning,
  },
  {
    id: '4',
    title: 'Payments & Helpdesk',
    description: 'Pay your maintenance bills securely and raise plumbing, electrical, or generic service tickets instantly.',
    image: require('../../../assets/images/splash_payments.png'),
    accent: Colors.success,
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="light" />

      {/* Skip Button */}
      {activeIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Image Slider */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.slider}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <Image source={slide.image} style={styles.posterImage} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {/* Info Card Overlay */}
      <View style={styles.infoCard}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i ? [styles.activeDot, { backgroundColor: Colors.primary }] : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Text Details */}
        <Text style={styles.slideTitle}>{slides[activeIndex].title}</Text>
        <Text style={styles.slideDesc}>{slides[activeIndex].description}</Text>

        {/* Action Button */}
        <Button
          title={activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          fullWidth
          size="lg"
          style={styles.actionBtn}
          icon={
            activeIndex === slides.length - 1 ? (
              <Ionicons name="rocket-outline" size={20} color={Colors.white} />
            ) : (
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5', // Matches the poster solid blue color theme
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: Spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  skipText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  logoSlideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  posterImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 280, // Leaves room for the bottom info card
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.xl,
    alignItems: 'center',
    height: 300,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: Colors.border,
  },
  slideTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  actionBtn: {
    marginTop: 'auto',
  },
});
