import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Une seule configuration pour les cinq paquets : les différences entre backend et front tiennent
// à l'environnement (node / navigateur) et aux hooks React, pas à des règles distinctes.
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'temp/**', 'backup/**', 'ioPort/**', 'packages/backend/uploads/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['packages/backend/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    files: ['packages/{frontend-public,frontend-private,shared-ui,content-renderer}/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Premier passage : ce qui est déjà à zéro violation reste en `error`, le reste passe en `warn`
  // pour que le linter serve de boussole au lieu de bloquer tout commit dès son installation.
  // À durcir au fil des nettoyages.
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Trois points d'entrée en ligne de commande et un mailer de repli : la console EST leur
  // sortie, pas une trace de débogage oubliée. Le logger structuré vaut pour le serveur HTTP.
  {
    files: [
      'packages/backend/src/migrate.ts',
      'packages/backend/src/shared/infrastructure/io/cli.ts',
      'packages/backend/src/contexts/contact/infrastructure/mailer/consoleMailer.ts',
    ],
    rules: { 'no-console': 'off' },
  },

  // En dernier : neutralise les règles de style qui entreraient en conflit avec Prettier.
  prettier,
);
