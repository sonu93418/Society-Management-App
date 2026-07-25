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
        projectId: "3a56f505-a9b1-43bb-b3d4-99c95fbfb2be"
      },
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "114494858273-c21iph66rhkeveqdqoo9qpud6q9eto1s.apps.googleusercontent.com",
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://society-management-app-w77v.onrender.com/api/v1",
      socketUrl: process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace("/api/v1", "") : "https://society-management-app-w77v.onrender.com"
    }
  }
};
