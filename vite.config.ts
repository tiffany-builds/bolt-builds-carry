import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isIosBuild = process.env.BUILD_TARGET === 'ios';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: isIosBuild ? 'dist-ios' : 'dist',
    rollupOptions: isIosBuild
      ? {
          input: {
            app: 'app.html',
          },
          external: ['@capacitor-community/rate-app'],
        }
      : {
          input: {
            main: 'app.html',
            index: 'index.html',
          },
          external: ['@capacitor-community/rate-app'],
        },
  },
  server: {
    open: '/app.html',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
