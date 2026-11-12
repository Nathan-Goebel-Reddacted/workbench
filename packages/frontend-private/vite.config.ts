import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // L'image de production sert ce front sous /admin/ (origine unique partagée avec le
  // site public et l'API). En dev il reste à la racine du serveur Vite.
  base: process.env.PRIVATE_BASE_PATH ?? '/',
  // Les variables VITE_* vivent dans le .env de la racine, partagé avec le backend et
  // docker compose : sans cet envDir, un build lancé hors Docker n'en voit aucune et
  // livre `%VITE_PUBLIC_URL%` tel quel dans index.html.
  envDir: path.resolve(__dirname, '../..'),
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
  },
  resolve: {
    alias: {
      '@atelier/shared-ui': path.resolve(__dirname, '../shared-ui/src'),
      '@content': path.resolve(__dirname, '../shared-ui/src/content'),
    },
  },
})
