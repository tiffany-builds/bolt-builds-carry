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
        }
      : {
          input: {
            main: 'app.html',
            index: 'index.html',
          },
        },
  },
  server: {
    open: '/app.html',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
