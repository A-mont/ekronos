import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import { checker } from 'vite-plugin-checker';

export default defineConfig({
  server: {
    allowedHosts: ['localhost'],
    proxy: {
      // 🔥 CLAVE: redirige /api al backend FastAPI
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills(),
    svgr(),
    checker({
      typescript: true,
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
});
