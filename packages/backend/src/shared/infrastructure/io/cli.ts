import { MikroORM } from '@mikro-orm/postgresql';
import { basename } from 'node:path';
import config from '../mikro-orm.config.js';
import { exportDatabase, importDatabase } from './databaseIoService.js';
import { ioPortPath, latestDump, readDump, writeDump } from './ioPortFiles.js';
import { archiveNameFor, createUploadsArchive, extractUploadsArchive } from './uploadsArchive.js';

function usage(): never {
    console.error('Usage:\n  io export\n  io import [file.sql]');
    process.exit(1);
}

async function runExport(orm: MikroORM): Promise<void> {
    const { filename, sql } = await exportDatabase(orm);
    await writeDump(filename, sql);

    const sizeKb = Math.max(1, Math.round(Buffer.byteLength(sql, 'utf8') / 1024));
    console.log(`Exported to ioPort/${filename} (${sizeKb} KB)`);

    const archive = archiveNameFor(filename);
    const files = await createUploadsArchive(ioPortPath(archive));
    console.log(files > 0 ? `Exported to ioPort/${archive} (${files} uploaded files)` : 'No uploaded file to carry');
}

async function runImport(orm: MikroORM, requested: string | undefined): Promise<void> {
    const filename = requested ? basename(requested) : await latestDump();
    if (!requested) console.log(`No file given, using the latest: ${filename}`);

    const dump = await readDump(filename);
    const report = await importDatabase(orm, dump);

    console.log(`Imported ioPort/${filename}`);

    const archive = archiveNameFor(filename);
    const restored = await extractUploadsArchive(ioPortPath(archive));
    console.log(
        restored
            ? `  restored uploads from ioPort/${archive}`
            : `  no ioPort/${archive} alongside the dump — documents may 404`,
    );
    if (report.length === 0) {
        console.log('  (no row reported)');
        return;
    }

    const width = Math.max(...report.map(row => row.table_name.length));
    let inserted = 0;
    let updated = 0;
    for (const row of report) {
        inserted += Number(row.inserted);
        updated += Number(row.updated);
        console.log(`  ${row.table_name.padEnd(width)}  +${row.inserted} inserted  ~${row.updated} updated`);
    }
    console.log(`  ${'total'.padEnd(width)}  +${inserted} inserted  ~${updated} updated`);
}

const [action, argument] = process.argv.slice(2);
if (action !== 'export' && action !== 'import') usage();

const orm = await MikroORM.init(config);
try {
    if (action === 'export') {
        await runExport(orm);
    } else {
        await runImport(orm, argument);
    }
} catch (error) {
    console.error(`\n${(error as Error).message}`);
    process.exitCode = 1;
} finally {
    await orm.close();
}
