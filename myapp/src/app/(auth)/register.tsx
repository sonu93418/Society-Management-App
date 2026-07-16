import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../api/client';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'resident' | 'guard'>('resident');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: selectedRole,
        societyId: 'DEMO_SOCIETY_ID', // Will be replaced with actual society
      });
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        await setAuth({ ...user, id: user.id || (user as any)._id }, accessToken, refreshToken);
        router.replace(selectedRole === 'guard' ? '/(guard)' : '/(resident)');
      }
    } catch (error) {
      Alert.alert('Registration Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your society on Portl</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>I am a</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'resident' && styles.roleButtonActive]}
              onPress={() => setSelectedRole('resident')}
            >
              <Ionicons name="home" size={22} color={selectedRole === 'resident' ? Colors.white : Colors.primary} />
              <Text style={[styles.roleButtonText, selectedRole === 'resident' && styles.roleButtonTextActive]}>Resident</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'guard' && styles.roleButtonActive]}
              onPress={() => setSelectedRole('guard')}
            >
              <Ionicons name="shield" size={22} color={selectedRole === 'guard' ? Colors.white : Colors.primary} />
              <Text style={[styles.roleButtonText, selectedRole === 'guard' && styles.roleButtonTextActive]}>Security Guard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input label="Full Name" placeholder="Enter your name" leftIcon="person-outline" value={name} onChangeText={setName} />
          <Input label="Email" placeholder="Enter your email" leftIcon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" placeholder="Enter phone number" leftIcon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Password" placeholder="Min. 6 characters" leftIcon="lock-closed-outline" value={password} onChangeText={setPassword} isPassword />
          <Input label="Confirm Password" placeholder="Re-enter password" leftIcon="lock-closed-outline" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Ionicons name="person-add-outline" size={20} color={Colors.white} />}
          />
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['4xl'], paddingBottom: Spacing['3xl'] },
  header: { marginBottom: Spacing['2xl'] },
  backButton: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs, marginBottom: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  roleSection: { marginBottom: Spacing.xl },
  roleLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.md },
  roleButtons: { flexDirection: 'row', gap: Spacing.md },
  roleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryGhost, gap: Spacing.sm },
  roleButtonActive: { backgroundColor: Colors.primary },
  roleButtonText: { ...Typography.bodyMedium, color: Colors.primary },
  roleButtonTextActive: { color: Colors.white },
  form: { backgroundColor: Colors.white, borderRadius: BorderRadius['3xl'], padding: Spacing['2xl'], ...Shadows.md },
  loginLink: { marginTop: Spacing.xl, alignItems: 'center' },
  loginText: { ...Typography.body, color: Colors.textSecondary },
  loginHighlight: { color: Colors.primary, fontWeight: '600' },
});
