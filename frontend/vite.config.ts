import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Librerías de UI grandes van en chunks separados
          "vendor-charts": ["recharts"],
          "vendor-icons":  ["lucide-react"],
          "vendor-react":  ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
})
