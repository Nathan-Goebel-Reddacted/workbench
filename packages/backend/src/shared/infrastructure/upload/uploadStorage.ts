import { EntityManager } from '@mikro-orm/postgresql';
import { unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IUploadStorage } from '@shared/application/port/iUploadStorage.js';

const UPLOADS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../uploads');

// Le premier caractère est alphanumérique et la classe exclut '/' : aucun '..' ni chemin
// composé ne peut sortir de cette capture, quel que soit le contenu de la base.
const UPLOAD_PATH = /\/uploads\/([A-Za-z0-9][A-Za-z0-9._-]*)/g;

// Il n'existe pas de table des documents : ils vivent dans les colonnes jsonb de leurs
// porteurs, et les sections de page dans celles des layouts. Un même fichier peut donc être
// cité depuis n'importe laquelle. Les descriptions et les notes en font partie : l'éditeur
// riche y insère des <img src> pointant sur les uploads.
const REFERENCE_SOURCES: ReadonlyArray<readonly [table: string, column: string]> = [
    ['projects', 'documents'],
    ['projects', 'links'],
    ['projects', 'description'],
    ['ideas', 'documents'],
    ['ideas', 'links'],
    ['ideas', 'description'],
    ['features', 'documents'],
    ['features', 'description'],
    ['tickets', 'documents'],
    ['tickets', 'notes'],
    ['tickets', 'description'],
    ['cvs', 'file_url'],
    ['page_layouts', 'sections'],
];

const REFERENCE_SQL = `select ${REFERENCE_SOURCES.map(
    ([table, column]) => `exists (select 1 from "${table}" where "${column}"::text like ?)`,
).join(' or ')} as referenced`;

function collectFilenames(value: unknown, found: Set<string>): void {
    if (typeof value === 'string') {
        for (const match of value.matchAll(UPLOAD_PATH)) found.add(match[1]);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) collectFilenames(item, found);
        return;
    }
    if (value !== null && typeof value === 'object') {
        for (const item of Object.values(value)) collectFilenames(item, found);
    }
}

export class UploadStorage implements IUploadStorage {
    constructor(private readonly em: EntityManager) {}

    async releaseFrom(value: unknown): Promise<void> {
        const filenames = new Set<string>();
        collectFilenames(value, filenames);

        for (const filename of filenames) {
            if (await this.isReferenced(filename)) continue;
            // Best-effort : un fichier déjà absent, ou un disque en lecture seule, ne doit pas
            // faire échouer la suppression métier qui vient d'aboutir.
            await unlink(join(UPLOADS_DIR, filename)).catch(() => undefined);
        }
    }

    // Le nom est un UUID généré par le serveur : la recherche par sous-chaîne est exacte en
    // pratique, et elle survit au changement d'origine des URLs déjà stockées.
    private async isReferenced(filename: string): Promise<boolean> {
        const pattern = `%${filename}%`;
        const rows = await this.em.getConnection().execute<Array<{ referenced: boolean }>>(
            REFERENCE_SQL,
            REFERENCE_SOURCES.map(() => pattern),
        );
        return rows[0]?.referenced === true;
    }
}
