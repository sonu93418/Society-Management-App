import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../theme';

const splashPoster = require('../../assets/images/splash_poster.png');

/**
 * This screen is shown only briefly while _layout.tsx restores the session
 * from SecureStore. Once isLoading becomes false, the AuthGate in _layout.tsx
 * navigates to the correct route via useEffect.
 *
 * It displays the beautiful 3D splash poster on boot.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={splashPoster}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <ActivityIndicator size="large" color={Colors.white} style={{ position: 'absolute', bottom: 80 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
