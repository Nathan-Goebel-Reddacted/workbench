import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // L'image de production sert ce front sous /admin/ (origine unique partagée avec le
  // site public et l'API). En dev il reste à la racine du serveur Vite.
  base: process.env.PRIVATE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
  },
  resolve: {
    alias: {
      '@atelier/shared-ui': path.resolve(__dirname, '../shared-ui/src'),
      '@atelier/content-renderer': path.resolve(__dirname, '../content-renderer/src'),
    },
  },
})
