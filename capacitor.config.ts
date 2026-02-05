import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otsempay.app',
  appName: 'Otsem Pay',
  webDir: 'www',
  server: {
    // In production, point to your deployed Next.js URL (Fly.io).
    // In development, switch to http://localhost:3000 (or your LAN IP for device testing).
    url: process.env.CAPACITOR_SERVER_URL || 'https://otsem-web.fly.dev',
    // Allow cleartext (HTTP) in dev — required for localhost on Android
    cleartext: process.env.NODE_ENV !== 'production',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#050010',
      showSpinner: false,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#6F00FF',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'Otsem Pay',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#050010',
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: '#050010',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
