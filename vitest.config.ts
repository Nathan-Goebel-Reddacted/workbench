import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const backendSrc = fileURLToPath(new URL('./packages/backend/src', import.meta.url));

// Un seul runner pour le monorepo. Cette passe ne couvre que du domaine et des fonctions pures :
// pas de base, pas de Fastify simulé, donc pas d'environnement navigateur à monter non plus.
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
    include: ['packages/*/src/**/*.test.ts'],
    passWithNoTests: false,
  },
});
