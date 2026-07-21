module.exports = {
  expo: {
    name: "Portl",
    slug: "portl",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    splash: {
      image: "./assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#4F46E5"
    },
    scheme: "portl",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/images/logo.png",
      bundleIdentifier: "com.portl.app",
      buildNumber: "1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#4F46E5",
        foregroundImage: "./assets/images/logo.png",
        monochromeImage: "./assets/images/logo.png"
      },
      package: "com.portl.app",
      versionCode: 1,
      predictiveBackGestureEnabled: false,
      // Only set googleServicesFile if the file exists to prevent CI/CD build crashes when the secret is not configured yet.
      googleServicesFile: (function() {
        const fs = require('fs');
        const path = require('path');
        if (process.env.GOOGLE_SERVICES_JSON) return process.env.GOOGLE_SERVICES_JSON;
        const localPath = path.resolve(__dirname, './google-services.json');
        return fs.existsSync(localPath) ? "./google-services.json" : undefined;
      })()
    },
    web: {
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#4F46E5",
          image: "./assets/images/logo.png",
          resizeMode: "contain",
          android: {
            image: "./assets/images/logo.png",
            resizeMode: "contain"
          },
          ios: {
            image: "./assets/images/logo.png",
            resizeMode: "contain"
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/logo.png",
          color: "#4F46E5",
          sounds: [
            "./assets/sounds/doorbell.wav",
            "./assets/sounds/complaint.wav",
            "./assets/sounds/success.wav",
            "./assets/sounds/emergency.wav",
            "./assets/sounds/general.wav"
          ],
          mode: "production"
        }
      ],
      "expo-build-properties",
      "@react-native-google-signin/google-signin"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "8711fdcc-1d94-40b2-9c61-ee508b4c4b8c"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://10.69.91.148:5000/api/v1",
      socketUrl: process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace("/api/v1", "") : "http://10.69.91.148:5000"
    }
  }
};
