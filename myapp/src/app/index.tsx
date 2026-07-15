import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../theme';

/**
 * This screen is shown only briefly while _layout.tsx restores the session
 * from SecureStore. Once isLoading becomes false, the AuthGate in _layout.tsx
 * navigates to the correct route via useEffect (never during render).
 *
 * Previously this used <Redirect href="/(auth)/login" /> which triggered
 * navigation synchronously during render — causing the React warning:
 * "Can't perform a React state update on a component that hasn't mounted yet."
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
