import { describe, expect, it, vi } from 'vitest';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UploadStorage } from './uploadStorage.js';
import type { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource.js';

// Ce composant supprime des fichiers. Ce qu'on vérifie ici n'est pas qu'il les supprime bien,
// mais qu'il interroge *toutes* les sources déclarées avant de le faire : une source oubliée
// ne produit aucune erreur, elle efface des fichiers encore cités.

const SOURCES: UploadReferenceSource[] = [
    { table: 'projects', column: 'documents' },
    { table: 'tickets', column: 'notes' },
    { table: 'cvs', column: 'file_url' },
];

function storage(referenced: boolean) {
    const execute = vi.fn(async () => [{ referenced }]);
    const em = { getConnection: () => ({ execute }) } as unknown as EntityManager;
    return { storage: new UploadStorage(em, SOURCES), execute };
}

describe('UploadStorage', () => {
    it('interroge chaque source déclarée, une fois par fichier', async () => {
        const { storage: uploads, execute } = storage(true);

        await uploads.release(['/uploads/a1b2c3.png']);

        expect(execute).toHaveBeenCalledTimes(1);
        const [sql, params] = execute.mock.calls[0] as unknown as [string, string[]];
        for (const { table, column } of SOURCES) {
            expect(sql).toContain(`from "${table}" where "${column}"`);
        }
        // Un paramètre par source : un décalage entre les deux ferait porter le motif sur la
        // mauvaise colonne, et la réponse n'aurait plus aucun sens.
        expect(params).toHaveLength(SOURCES.length);
        expect(new Set(params)).toEqual(new Set(['%a1b2c3.png%']));
    });

    it('trouve les URLs enfouies dans un contenu arbitraire', async () => {
        const { storage: uploads, execute } = storage(true);

        await uploads.releaseFromContent({
            blocks: [
                { html: '<p><img src="/uploads/aaa.png"> et <img src="/uploads/bbb.webp"></p>' },
                { nested: [{ url: '/uploads/ccc.pdf' }] },
            ],
        });

        // Trois fichiers distincts trouvés à trois profondeurs différentes.
        expect(execute).toHaveBeenCalledTimes(3);
        const found = execute.mock.calls.map(call => (call as unknown as [string, string[]])[1][0]);
        expect(new Set(found)).toEqual(new Set(['%aaa.png%', '%bbb.webp%', '%ccc.pdf%']));
    });

    it('ne sort jamais du dossier des uploads, quel que soit le contenu en base', async () => {
        const { storage: uploads, execute } = storage(true);

        await uploads.releaseFromContent('/uploads/../../etc/passwd and /uploads/./x');

        // `..` et `.` ne peuvent pas être capturés : le motif exige un premier caractère
        // alphanumérique et exclut '/'.
        const found = execute.mock.calls.map(call => (call as unknown as [string, string[]])[1][0]);
        expect(found).not.toContain('%..%');
        expect(found.every(pattern => !pattern.includes('/'))).toBe(true);
    });

    it('refuse de démarrer sans aucune source — il effacerait tout', () => {
        const em = { getConnection: () => ({ execute: async () => [] }) } as unknown as EntityManager;

        expect(() => new UploadStorage(em, [])).toThrow('at least one reference source');
    });

    it('ne touche à rien quand il n’y a aucune URL à libérer', async () => {
        const { storage: uploads, execute } = storage(false);

        await uploads.release([]);

        expect(execute).not.toHaveBeenCalled();
    });
});
