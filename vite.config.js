// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // обязательно
  server: {
    host: '0.0.0.0', // доступ извне (ngrok)
    port: 5173,
    strictPort: true,

    // важно! — сообщает Vite правильный публичный адрес
    origin: 'https://marvelrivalsreviews.vercel.app/',

    cors: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.135.21',
      'https://marvelrivalsreviews.vercel.app/',
    ],

    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },

    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
})
