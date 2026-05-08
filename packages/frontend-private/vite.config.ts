import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
  },
  resolve: {
    alias: {
      '@atelier/shared-ui': path.resolve(__dirname, '../shared-ui/src'),
    },
  },
})
