import AdmZip from 'adm-zip';
import { mkdir, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BACKUP_DIR = fileURLToPath(new URL('../../../../../../backup/', import.meta.url));

export type BackupEntry = { path: string; name: string };

export function dateStamp(date = new Date()): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}${month}${date.getFullYear()}`;
}

export async function nextBackupName(stamp = dateStamp()): Promise<string> {
    const taken = new Set(await readdir(BACKUP_DIR).catch(() => [] as string[]));
    if (!taken.has(`${stamp}.zip`)) return stamp;

    let suffix = 2;
    while (taken.has(`${stamp}-${suffix}.zip`)) suffix += 1;
    return `${stamp}-${suffix}`;
}

export function buildZip(folder: string, entries: BackupEntry[]): Buffer {
    const zip = new AdmZip();
    for (const entry of entries) {
        zip.addLocalFile(entry.path, folder, entry.name);
    }
    return zip.toBuffer();
}

export async function writeBackupZip(entries: BackupEntry[]): Promise<string> {
    await mkdir(BACKUP_DIR, { recursive: true });

    const name = await nextBackupName();
    const filename = `${name}.zip`;
    const zip = new AdmZip();
    for (const entry of entries) {
        zip.addLocalFile(entry.path, name, entry.name);
    }
    zip.writeZip(join(BACKUP_DIR, filename));

    return filename;
}

export function readZipEntries(buffer: Buffer): Map<string, Buffer> {
    const found = new Map<string, Buffer>();
    for (const entry of new AdmZip(buffer).getEntries()) {
        if (entry.isDirectory) continue;
        found.set(basename(entry.entryName), entry.getData());
    }
    return found;
}

export function backupPath(filename: string): string {
    return resolve(BACKUP_DIR, basename(filename));
}
