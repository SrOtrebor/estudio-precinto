import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/live-feed/',
  optimizeDeps: {
    include: ['firebase/app', 'firebase/database', 'firebase/storage'],
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
})

