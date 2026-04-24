import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carry.app',
  appName: 'Carry',
  webDir: 'dist-ios',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#E8DDD0',
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#E8DDD0',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#E8DDD0',
    }
  }
};

export default config;
