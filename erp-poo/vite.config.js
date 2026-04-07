import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      // Backend API — reescribe /api/xxx → /xxx en localhost:4000
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: function (path) { return path.replace(/^\/api/, ''); },
      },
      // Chat REST — reescribe /chat/xxx → /xxx en localhost:4001
      '/chat': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        rewrite: function (path) { return path.replace(/^\/chat/, ''); },
      },
      // Socket.IO — WebSocket proxy a localhost:4001
      '/socket.io': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        ws: true,
      },
    },
  }
})