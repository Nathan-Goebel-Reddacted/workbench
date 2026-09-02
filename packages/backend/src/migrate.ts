import { MikroORM } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import config from './shared/infrastructure/mikro-orm.config.js';

// La CLI enregistre le Migrator elle-même ; hors CLI il faut le déclarer, sans quoi
// orm.getMigrator() lève « Migrator extension not registered ».
const orm = await MikroORM.init({ ...config, extensions: [Migrator] });

try {
    const migrator = orm.getMigrator();
    const pending = await migrator.getPendingMigrations();

    if (pending.length === 0) {
        console.log('No pending migration.');
    } else {
        console.log(`Applying ${pending.length} migration(s):`);
        for (const migration of pending) console.log(`  - ${migration.name}`);
        await migrator.up();
        console.log('Done.');
    }
} catch (err) {
    console.error('Migration failed:', err);
    await orm.close();
    process.exit(1);
}

await orm.close();
