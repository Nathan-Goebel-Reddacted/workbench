import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

// La config racine couvre le monorepo entier ; celle-ci permet de lancer la seule suite du
// backend depuis son propre dossier (`npm test` dans packages/backend). Les alias doivent y
// être répétés : sans eux, tout module traversant @shared ou @contexts échoue au chargement,
// y compris quand le test lui-même n'y touche pas.
export default defineConfig({
    resolve: {
        alias: {
            '@shared': `${src}/shared`,
            '@contexts': `${src}/contexts`,
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        passWithNoTests: false,
    },
});
