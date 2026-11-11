import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: '/dss/',
  server: { proxy: { '/dss/api': 'http://127.0.0.1:8000' } }
});
