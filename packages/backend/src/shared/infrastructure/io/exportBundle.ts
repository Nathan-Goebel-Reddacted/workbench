import { MikroORM } from '@mikro-orm/postgresql';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportDatabase } from './databaseIoService.js';
import { archiveNameFor, createUploadsArchive } from './uploadsArchive.js';
import { type BackupEntry } from './backupArchive.js';

export type ExportBundle = {
    filename: string;
    archiveName: string;
    sql: string;
    uploads: number;
    entries: BackupEntry[];
    dispose: () => Promise<void>;
};

export async function createExportBundle(orm: MikroORM): Promise<ExportBundle> {
    const { filename, sql } = await exportDatabase(orm);
    const archiveName = archiveNameFor(filename);

    const dir = await mkdtemp(join(tmpdir(), 'atelier-export-'));
    const sqlPath = join(dir, filename);
    const archivePath = join(dir, archiveName);

    await writeFile(sqlPath, sql, 'utf8');
    const uploads = await createUploadsArchive(archivePath);

    const entries: BackupEntry[] = [{ path: sqlPath, name: filename }];
    if (uploads > 0) entries.push({ path: archivePath, name: archiveName });

    return {
        filename,
        archiveName,
        sql,
        uploads,
        entries,
        dispose: () => rm(dir, { recursive: true, force: true }),
    };
}
