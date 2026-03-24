import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target:
          'https://thr-72b94cad-educon-pos-backend-api.nxcode-io.workers.dev',
        changeOrigin: true,
      },
    },
  },
})