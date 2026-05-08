import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.70f79ed3f0874215913ad377e2fdf8a7',
  appName: 'Lineage Collections Portal',
  webDir: 'dist',
  server: {
    url: 'https://70f79ed3-f087-4215-913a-d377e2fdf8a7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
