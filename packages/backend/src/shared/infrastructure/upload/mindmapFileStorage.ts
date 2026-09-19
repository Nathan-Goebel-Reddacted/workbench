import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMindmapStorage } from '@shared/application/port/iMindmapStorage.js';
import { MINDMAP_SUFFIX } from '@shared/domain/valueObject/documentType.js';

const UPLOADS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../uploads');

export class MindmapFileStorage implements IMindmapStorage {
    constructor(private readonly uploadsDir: string = UPLOADS_DIR) {}

    async store(content: unknown): Promise<string> {
        const filename = `${randomUUID()}${MINDMAP_SUFFIX}`;
        await mkdir(this.uploadsDir, { recursive: true });
        await writeFile(join(this.uploadsDir, filename), JSON.stringify(content));
        return `/uploads/${filename}`;
    }
}
