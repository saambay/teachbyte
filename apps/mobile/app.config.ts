import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TeachByte',
  slug: 'teachbyte',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#4F46E5',
  },
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.teachbyte.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#4F46E5',
    },
    package: 'com.teachbyte.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  scheme: 'teachbyte',
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    authMode: process.env.EXPO_PUBLIC_AUTH_MODE || 'dev',
  },
});
