import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'app.html',
        index: 'index.html',
      }
    }
  },
  server: {
    open: '/app.html'
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
