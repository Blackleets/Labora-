import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.labora.plus',
  appName: 'Labora+',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    Keyboard: {
      resize: 'body'
    },
    StatusBar: {
      style: 'DARK'
    }
  }
};

export default config;
