import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../theme';

const appLogo = require('../../assets/images/logo.png');

export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={appLogo}
        style={{ width: 180, height: 180 }}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={Colors.white} style={{ position: 'absolute', bottom: 80 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
