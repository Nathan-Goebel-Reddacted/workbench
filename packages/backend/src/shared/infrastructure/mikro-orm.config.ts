import './config/loadEnvFile.js';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { fileURLToPath } from 'node:url';

// Ancrés sur ce fichier, pas sur le cwd : en production le processus démarre depuis /app
// alors que le code vit dans /app/packages/backend. `../../../` remonte de la même façon
// depuis src/shared/infrastructure/ et depuis dist/shared/infrastructure/.
// Les globs de MikroORM n'acceptent que des séparateurs POSIX, y compris sous Windows.
const packageRoot = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\\/g, '/');

export default defineConfig({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
    dbName: process.env.POSTGRES_DB ?? 'workbench',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    metadataProvider: TsMorphMetadataProvider,
    entities: [`${packageRoot}dist/contexts/*/infrastructure/entity/*.js`],
    entitiesTs: [`${packageRoot}src/contexts/*/infrastructure/entity/*.ts`],
    migrations: {
        path: `${packageRoot}dist/shared/infrastructure/migrations`,
        pathTs: `${packageRoot}src/shared/infrastructure/migrations`,
        transactional: true,
    },
    pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 600000,
    },
    debug: process.env.NODE_ENV === 'development',
});
