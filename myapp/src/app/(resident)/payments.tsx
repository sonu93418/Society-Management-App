import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { PaymentStatus } from '../../types/models';


import { usePayments, usePayDues } from '../../hooks/useCommunity';
import { ActivityIndicator } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Payment } from '../../types/models';

export default function PaymentsScreen() {
  const { data: response, isLoading, refetch } = usePayments();
  const payMutation = usePayDues();

  const payments = response?.data?.payments || [];
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'paid'>('all');

  const totalDue = payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = activeTab === 'all'
    ? payments
    : activeTab === 'due'
      ? payments.filter((p) => p.status !== 'paid')
      : payments.filter((p) => p.status === 'paid');

  const handlePay = (payment: Payment) => {
    Alert.alert(
      'Pay Maintenance',
      `Amount: ₹${payment.amount.toLocaleString()}\n${payment.month} ${payment.year}\n\nThis is a demo payment — would you like to simulate successful payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay ₹' + payment.amount.toLocaleString(),
          onPress: () => {
            payMutation.mutate(
              { paymentId: payment._id, transactionId: 'TXN_' + Date.now() },
              {
                onSuccess: () => {
                  Alert.alert('Payment Successful! ✅', `₹${payment.amount.toLocaleString()} paid for ${payment.month} ${payment.year}`);
                  refetch();
                },
                onError: (err: any) => {
                  Alert.alert('Error', err?.message || 'Failed to complete payment');
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { borderTopColor: Colors.danger, borderTopWidth: 3 }]}>
            <Text style={styles.summaryLabel}>Total Due</Text>
            <Text style={[styles.summaryAmount, { color: Colors.danger }]}>₹{totalDue.toLocaleString()}</Text>
          </Card>
          <Card style={[styles.summaryCard, { borderTopColor: Colors.success, borderTopWidth: 3 }]}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryAmount, { color: Colors.success }]}>₹{totalPaid.toLocaleString()}</Text>
          </Card>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['all', 'due', 'paid'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment List */}
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="No Payments Found"
            description="There are no maintenance or fee payments in this category."
          />
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment._id} style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <View style={[styles.paymentIcon, {
                  backgroundColor: payment.status === 'paid' ? Colors.successLight : payment.status === 'overdue' ? Colors.dangerLight : Colors.warningLight
                }]}>
                  <Ionicons
                    name={payment.status === 'paid' ? 'checkmark-circle' : payment.status === 'overdue' ? 'alert-circle' : 'time'}
                    size={22}
                    color={payment.status === 'paid' ? Colors.success : payment.status === 'overdue' ? Colors.danger : Colors.warning}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMonth}>{payment.month} {payment.year}</Text>
                  <Text style={styles.paymentDesc}>{payment.description}</Text>
                  {payment.paidAt && (
                    <Text style={styles.paidDate}>Paid on {new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  )}
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                  <Badge label={payment.status} variant={payment.status as any} size="sm" />
                </View>
              </View>
              {payment.status !== 'paid' && (
                <Button
                  title={`Pay ₹${payment.amount.toLocaleString()}`}
                  onPress={() => handlePay(payment)}
                  fullWidth
                  size="sm"
                  style={{ marginTop: Spacing.md }}
                  variant={payment.status === 'overdue' ? 'danger' : 'primary'}
                />
              )}
            </Card>
          ))
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },

  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryAmount: { ...Typography.h3, marginTop: Spacing.xs },

  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xs, marginBottom: Spacing.xl, ...Shadows.xs },
  tab: { flex: 1, paddingVertical: Spacing.sm + 2, alignItems: 'center', borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.captionMedium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  paymentCard: { marginBottom: Spacing.md },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1, marginLeft: Spacing.md },
  paymentMonth: { ...Typography.bodyMedium, color: Colors.text },
  paymentDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  paidDate: { ...Typography.caption, color: Colors.success, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: Spacing.xs },
  paymentAmount: { ...Typography.h4, color: Colors.text },
});
