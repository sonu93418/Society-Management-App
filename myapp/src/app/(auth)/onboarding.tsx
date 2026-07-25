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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WorkflowStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  actor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badgeBg: string;
  badgeColor: string;
  iconBg: string;
  details: string;
  features: string[];
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: 1,
    title: 'Admin Registers Housing Society',
    subtitle: 'Management inputs society details, towers & flat numbers',
    actor: 'STEP 01 — ADMIN PORTAL',
    iconName: 'business',
    badgeBg: '#EEF2FF',
    badgeColor: Colors.primary,
    iconBg: Colors.primary,
    details: 'Society President or Management registers society name, address, tower count, and unit numbers into Portl.',
    features: ['Society profile & tower mapping creation', 'Initial Admin account setup & credentials', 'Automated platform approval request'],
  },
  {
    stepNumber: 2,
    title: 'Developer / Platform Activation',
    subtitle: 'System verifies society credentials & issues Guard Code',
    actor: 'STEP 02 — SYSTEM APPROVAL',
    iconName: 'checkmark-circle',
    badgeBg: '#ECFDF5',
    badgeColor: Colors.successDark,
    iconBg: Colors.success,
    details: 'Platform Developer verifies society details, activates live database, and generates the Guard Registration Code.',
    features: ['Instant security & platform verification', 'Guard Registration Code generation', 'Full activation of society portal'],
  },
  {
    stepNumber: 3,
    title: 'Security Guard Onboarding & Gate Log',
    subtitle: 'Guards register with code & scan visitor passes at gate',
    actor: 'STEP 03 — GUARD TERMINAL',
    iconName: 'shield-checkmark',
    badgeBg: '#FFF7ED',
    badgeColor: Colors.warningDark,
    iconBg: Colors.warning,
    details: 'Security Guards log in at the main gate using the registration code. They verify 6-digit visitor passes & log entry photos.',
    features: ['Guard terminal login via registration code', 'Instant 6-digit visitor pass verification', 'Real-time gate arrival notifications'],
  },
  {
    stepNumber: 4,
    title: 'Resident Smart Living & Governance',
    subtitle: 'Verified residents pre-approve guests, pay dues & vote',
    actor: 'STEP 04 — RESIDENT PORTAL',
    iconName: 'home',
    badgeBg: '#F3E8FF',
    badgeColor: '#7E22CE',
    iconBg: '#8B5CF6',
    details: 'Verified Residents generate guest passes, pay monthly maintenance dues, participate in live polls, and file helpdesk tickets.',
    features: ['Pre-approve visitor & delivery entry passes', 'Pay maintenance invoices & download receipts', 'Vote on democratic polls & log repair tickets'],
  },
];

const slides = [
  {
    id: '1',
    title: 'Welcome to Portl',
    subtitle: 'Smart Living Unified',
    description: 'Manage your home and stay connected with your community on India\'s most premium society management portal.',
    image: require('../../../assets/images/splash_poster.png'),
    isWorkflowSlide: false,
  },
  {
    id: '2',
    title: 'App Ecosystem Workflow',
    subtitle: 'Top to Bottom Formation',
    description: '1. Admin Registers Society → 2. Developer Approves → 3. Guard Scans Gate → 4. Resident Smart Living.',
    image: require('../../../assets/images/splash_workflow.png'),
    isWorkflowSlide: true,
  },
  {
    id: '3',
    title: 'Notices & Democratic Polls',
    subtitle: 'Speak Up — Announce Your Message!',
    description: 'Stay updated with official society broadcasts, emergency announcements, and cast your vote in live polls.',
    image: require('../../../assets/images/splash_community.png'),
    isWorkflowSlide: false,
  },
  {
    id: '4',
    title: 'Smart Gate Security',
    subtitle: 'Real-time Gate Clearance',
    description: 'Pre-approve guests, register delivery executives, and get instant notification alerts on guest arrival.',
    image: require('../../../assets/images/splash_security.png'),
    isWorkflowSlide: false,
  },
  {
    id: '5',
    title: 'Payments & Helpdesk',
    subtitle: 'Dues & Maintenance Tickets',
    description: 'Pay your maintenance bills securely, participate in polls, and raise plumbing or electrical service tickets.',
    image: require('../../../assets/images/splash_payments.png'),
    isWorkflowSlide: false,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<WorkflowStep | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/login');
  };

  const openWorkflowStepModal = (step: WorkflowStep) => {
    Haptics.selectionAsync();
    setSelectedWorkflowStep(step);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Skip Button */}
      {activeIndex < slides.length - 1 && (
        <TouchableOpacity
          style={[styles.skipButton, { top: Math.max(insets.top, 16) + 6 }]}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Full-Screen Edge-to-Edge Upper Image Slider */}
      <View style={styles.sliderContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <Image source={slide.image} style={styles.posterImage} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Spacious & Beautiful Bottom Description Card */}
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
        <View style={styles.textDetailsContainer}>
          <Text style={styles.slideTitle}>{slides[activeIndex].title}</Text>
          <Text style={styles.slideDesc}>{slides[activeIndex].description}</Text>
        </View>

        {/* Special 2nd Splash Screen: Interactive Workflow Feature Button */}
        {slides[activeIndex].isWorkflowSlide && (
          <TouchableOpacity
            style={styles.exploreWorkflowBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowWorkflowModal(true);
            }}
          >
            <Ionicons name="git-network" size={16} color={Colors.primary} />
            <Text style={styles.exploreWorkflowText}>View 4-Step Ecosystem Breakdown</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}

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

      {/* Workflow Modal (2nd Splash Screen Workflow Analysis) */}
      <Modal
        visible={showWorkflowModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWorkflowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="git-network" size={22} color={Colors.primary} />
                <Text style={styles.modalHeaderTitle}>App Workflow (Top to Bottom)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWorkflowModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalIntroText}>
                Step-by-step lifecycle showing how Admins, Super Admin Developers, Security Guards, and Residents interact seamlessly:
              </Text>

              {WORKFLOW_STEPS.map((step, idx) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.workflowNodeCard}
                  onPress={() => openWorkflowStepModal(step)}
                  activeOpacity={0.85}
                >
                  <View style={styles.nodeLeftColumn}>
                    <View style={[styles.solidIconCircle, { backgroundColor: step.iconBg }]}>
                      <Ionicons name={step.iconName} size={20} color={Colors.white} />
                    </View>
                    {idx < WORKFLOW_STEPS.length - 1 && <View style={styles.verticalNodeLine} />}
                  </View>

                  <View style={styles.nodeBody}>
                    <View style={styles.nodeActorRow}>
                      <View style={[styles.actorBadge, { backgroundColor: step.badgeBg }]}>
                        <Text style={[styles.actorBadgeText, { color: step.badgeColor }]}>{step.actor}</Text>
                      </View>
                    </View>
                    <Text style={styles.nodeTitle}>{step.title}</Text>
                    <Text style={styles.nodeSubtitle}>{step.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              title="Close Workflow"
              onPress={() => setShowWorkflowModal(false)}
              fullWidth
              size="md"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Step Detail Modal */}
      <Modal
        visible={!!selectedWorkflowStep}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedWorkflowStep(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '65%' }]}>
            {selectedWorkflowStep && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.solidIconCircle, { backgroundColor: selectedWorkflowStep.iconBg }]}>
                    <Ionicons name={selectedWorkflowStep.iconName} size={22} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={styles.modalHeaderTitle}>{selectedWorkflowStep.title}</Text>
                    <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{selectedWorkflowStep.actor}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedWorkflowStep(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.stepDetailDesc}>{selectedWorkflowStep.details}</Text>

                <Text style={styles.sectionTitle}>Key Actions</Text>
                {selectedWorkflowStep.features.map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={selectedWorkflowStep.iconBg} />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}

                <Button
                  title="Done"
                  onPress={() => setSelectedWorkflowStep(null)}
                  fullWidth
                  size="sm"
                  style={{ marginTop: Spacing.lg }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  skipText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Locked upper poster slider container ──
  sliderContainer: {
    height: SCREEN_HEIGHT * 0.68,
    backgroundColor: '#2C3DE3',
    overflow: 'hidden',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },

  // ── Bottom info card (pure white filling to bottom of screen) ──
  infoCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -32,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Colors.border,
  },
  textDetailsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  slideTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  slideDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    lineHeight: 22,
  },
  exploreWorkflowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGhost,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  exploreWorkflowText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionBtn: {
    width: '100%',
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '800',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalScrollContent: {
    paddingVertical: Spacing.xs,
  },
  modalIntroText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },

  // ── Workflow Nodes ──
  workflowNodeCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  nodeLeftColumn: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  solidIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  verticalNodeLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  nodeBody: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  nodeActorRow: {
    marginBottom: 4,
  },
  actorBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  actorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nodeTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  nodeSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  stepDetailDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    ...Typography.bodySm,
    color: Colors.text,
  },
});
