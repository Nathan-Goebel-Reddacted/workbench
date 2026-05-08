import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
    dbName: process.env.POSTGRES_DB ?? 'workbench',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    metadataProvider: TsMorphMetadataProvider,
    entities: ['./dist/contexts/*/infrastructure/entity/*.js'],
    entitiesTs: ['./src/contexts/*/infrastructure/entity/*.ts'],
    migrations: {
        path: './src/shared/infrastructure/migrations',
        pathTs: './src/shared/infrastructure/migrations',
        transactional: true,
    },
    pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 600000,
    },
    debug: process.env.NODE_ENV === 'development',
});
