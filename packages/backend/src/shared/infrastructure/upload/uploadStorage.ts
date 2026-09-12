import { EntityManager } from '@mikro-orm/postgresql';
import { unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource.js';

const UPLOADS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../uploads');

// Le premier caractère est alphanumérique et la classe exclut '/' : aucun '..' ni chemin
// composé ne peut sortir de cette capture, quel que soit le contenu de la base.
const UPLOAD_PATH = /\/uploads\/([A-Za-z0-9][A-Za-z0-9._-]*)/g;

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

/**
 * Il n'existe pas de table des documents : ils vivent dans les colonnes jsonb de leurs
 * porteurs, et les sections de page dans celles des layouts. Un même fichier peut donc être
 * cité depuis n'importe laquelle — d'où le comptage de références avant toute suppression.
 *
 * La liste des endroits où chercher n'est plus écrite ici : chaque contexte déclare les siens
 * (`uploadReferences.ts`) et le composition root les rassemble. Un contexte ajouté et oublié
 * se voyait autrefois à ceci près que rien ne cassait — les fichiers encore cités par lui
 * disparaissaient en silence.
 */
export class UploadStorage implements IUploadStorage {
    private readonly referenceSql: string;
    private readonly patternCount: number;

    constructor(
        private readonly em: EntityManager,
        sources: readonly UploadReferenceSource[],
    ) {
        if (sources.length === 0) {
            throw new Error('UploadStorage needs at least one reference source, or it would delete every file');
        }
        this.patternCount = sources.length;
        this.referenceSql = `select ${sources
            .map(({ table, column }) => `exists (select 1 from "${table}" where "${column}"::text like ?)`)
            .join(' or ')} as referenced`;
    }

    async release(urls: string[]): Promise<void> {
        await this.releaseFromContent(urls);
    }

    async releaseFromContent(content: unknown): Promise<void> {
        const filenames = new Set<string>();
        collectFilenames(content, filenames);

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
            this.referenceSql,
            Array.from({ length: this.patternCount }, () => pattern),
        );
        return rows[0]?.referenced === true;
    }
}
