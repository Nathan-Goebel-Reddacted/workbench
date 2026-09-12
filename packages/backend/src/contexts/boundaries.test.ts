import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

// Le filet qui empêche la dérive de revenir.
//
// Un contexte qui atteint le `domain/` d'un autre contexte contourne son contrat public. Ce
// n'est jamais une erreur visible : le code compile, les tests passent, et le couplage
// s'installe. C'est ainsi que `ListMediaImagesHandler` avait fini par lire trois dépôts
// étrangers depuis sa couche application.
//
// La seule exception est la couche anticorruption : un adaptateur d'infrastructure, qui
// existe précisément pour traduire un voisin en vocabulaire local et concentrer le couplage
// en un endroit nommé.

const CONTEXTS_DIR = dirname(fileURLToPath(import.meta.url));

/** Les répertoires où un contexte a le droit de connaître un voisin. */
const ANTICORRUPTION_LAYERS = ['infrastructure/gateway', 'infrastructure/uploadReferences'];

/** `@contexts/<nom>/<couche>/<sous-couche>/…` */
const CROSS_CONTEXT_IMPORT = /from '@contexts\/([a-zA-Z-]+)\/([a-zA-Z]+)(?:\/([a-zA-Z]+))?/g;

type Violation = { file: string; line: number; target: string; path: string };

function sourceFiles(directory: string = CONTEXTS_DIR): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
    });
}

/** Le contexte auquel appartient un fichier, d'après son chemin. */
function contextOf(file: string): string {
    return relative(CONTEXTS_DIR, file).split(sep)[0];
}

function isAnticorruptionLayer(file: string): boolean {
    const path = relative(CONTEXTS_DIR, file).split(sep).join('/');
    return ANTICORRUPTION_LAYERS.some(layer => path.includes(`/${layer}`));
}

function collectViolations(predicate: (layer: string, sublayer: string | undefined) => boolean): Violation[] {
    const violations: Violation[] = [];

    for (const file of sourceFiles()) {
        const own = contextOf(file);
        const lines = readFileSync(file, 'utf8').split(/\r?\n/);

        lines.forEach((line, index) => {
            for (const match of line.matchAll(CROSS_CONTEXT_IMPORT)) {
                const [, target, layer, sublayer] = match;
                if (target === own) continue;
                if (!predicate(layer, sublayer)) continue;
                violations.push({
                    file: relative(CONTEXTS_DIR, file),
                    line: index + 1,
                    target,
                    path: `@contexts/${target}/${layer}${sublayer ? `/${sublayer}` : ''}`,
                });
            }
        });
    }

    return violations;
}

describe('frontières entre contextes', () => {
    it('n’atteint le domaine d’un voisin que depuis une couche anticorruption', () => {
        const offenders = collectViolations((layer, sublayer) => {
            if (layer !== 'domain') return false;
            // Un `domain/port` est publié pour être implémenté depuis l'extérieur — c'est sa
            // raison d'être. `IUserDeletionListener` existe précisément pour qu'un autre
            // contexte s'y branche : l'importer est le contrat, pas son contournement.
            return sublayer !== 'port';
        }).filter(violation => !isAnticorruptionLayer(join(CONTEXTS_DIR, violation.file)));

        // Un contexte parle à ses voisins par leurs commandes et leurs requêtes. S'il lui faut
        // davantage, la réponse est un port chez lui et un adaptateur dans
        // `infrastructure/gateway/` — pas un import direct.
        expect(offenders.map(v => `${v.file}:${v.line} → ${v.path}`)).toEqual([]);
    });

    it('n’atteint jamais l’infrastructure d’un voisin', () => {
        const offenders = collectViolations(layer => layer === 'infrastructure');

        // Un dépôt, une entité ORM ou un client HTTP voisin ne sont le contrat de personne.
        // Seul le composition root a le droit de les assembler.
        expect(offenders.map(v => `${v.file}:${v.line} → ${v.path}`)).toEqual([]);
    });
});
