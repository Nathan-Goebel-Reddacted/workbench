import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IFileStorage } from '@shared/application/port/iFileStorage.js';

const UPLOADS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../uploads');

export class FileStorage implements IFileStorage {
    constructor(private readonly uploadsDir: string = UPLOADS_DIR) {}

    async save(extension: string, content: Buffer): Promise<string> {
        const filename = `${randomUUID()}${extension}`;
        await mkdir(this.uploadsDir, { recursive: true });
        await writeFile(join(this.uploadsDir, filename), content);
        return `/uploads/${filename}`;
    }

    async rewrite(filename: string, content: string): Promise<boolean> {
        const target = join(this.uploadsDir, filename);
        try {
            await access(target);
        } catch {
            return false;
        }
        await writeFile(target, content);
        return true;
    }

    async read(filename: string): Promise<string | null> {
        try {
            return await readFile(join(this.uploadsDir, filename), 'utf-8');
        } catch {
            return null;
        }
    }
}
