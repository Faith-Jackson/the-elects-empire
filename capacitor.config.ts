import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.electsempire.app',
  appName: 'The Elects Empire',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
