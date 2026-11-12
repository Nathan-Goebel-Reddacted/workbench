import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const backendSrc = fileURLToPath(new URL('./packages/backend/src', import.meta.url));

// Un seul runner pour le monorepo. Cette passe ne touche pas de base : du domaine, des fonctions
// pures, et un Fastify monté en mémoire (server.test.ts) dont l'ORM est simulé. Pas d'environnement
// navigateur à monter non plus.
export default defineConfig({
  resolve: {
    // Mêmes alias que le tsconfig du backend : sans eux, tout module qui traverse @shared
    // ou @contexts échoue au chargement, y compris quand le test lui-même n'y touche pas.
    alias: {
      '@shared': `${backendSrc}/shared`,
      '@contexts': `${backendSrc}/contexts`,
    },
  },
  test: {
    environment: 'node',
    env: {
      JWT_SECRET: '0'.repeat(64),
      APP_URL: 'http://localhost:3000',
      FRONTEND_PUBLIC_URL: 'http://localhost:5173',
      FRONTEND_PRIVATE_URL: 'http://localhost:5174',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret',
    },
    include: ['packages/*/src/**/*.test.ts'],
    passWithNoTests: false,
  },
});
