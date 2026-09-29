import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Provider credentials belong to Supabase Edge Functions, never browser defines.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
