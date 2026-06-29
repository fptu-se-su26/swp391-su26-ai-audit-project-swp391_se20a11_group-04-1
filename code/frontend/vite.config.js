import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls đến Spring Boot backend (tránh CORS khi dev)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        xfwd: true,
        ws: true, // ✅ Quan trọng: Hỗ trợ proxy kết nối WebSocket
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@api': '/src/api',
      '@assets': '/src/assets',
      '@components': '/src/components',
      '@context': '/src/context',
      '@features': '/src/features',
      '@hooks': '/src/hooks',
      '@routes': '/src/routes',
      '@store': '/src/store',
      '@utils': '/src/utils',
      '@styles': '/src/styles',
    }
  }
})
