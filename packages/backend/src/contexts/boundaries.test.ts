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

// ── Les couches à l'intérieur d'un contexte ────────────────────────────────────────────
//
// La règle précédente ne voit que ce qui traverse une frontière de contexte. Elle a laissé
// passer l'appairage d'agent : demande, code, durée de vie et quota vivaient dans une route,
// avec le dépôt concret injecté à la main — un cas d'usage entier logé dans l'infrastructure,
// invisible au compilateur comme aux tests.

/** `'./x'`, `'../x'` ou `'@contexts/<sien>/x'` — ce qui, au bout du compte, désigne un fichier du même contexte. */
function localTarget(file: string, specifier: string): string | null {
    const own = contextOf(file);

    if (specifier.startsWith('@contexts/')) {
        const rest = specifier.slice('@contexts/'.length);
        return rest.startsWith(`${own}/`) ? rest.slice(own.length + 1) : null;
    }
    if (!specifier.startsWith('.')) return null;

    const resolved = join(dirname(file), specifier);
    const path = relative(CONTEXTS_DIR, resolved).split(sep).join('/');
    return path.startsWith(`${own}/`) ? path.slice(own.length + 1) : null;
}

const IMPORT_SPECIFIER = /from '([^']+)'/g;

type LayerViolation = { file: string; line: number; specifier: string };

function collectLayerViolations(forbidden: (from: string, to: string) => boolean): LayerViolation[] {
    const violations: LayerViolation[] = [];

    for (const file of sourceFiles()) {
        const from = relative(CONTEXTS_DIR, file).split(sep).slice(1).join('/');
        const lines = readFileSync(file, 'utf8').split(/\r?\n/);

        lines.forEach((line, index) => {
            for (const [, specifier] of line.matchAll(IMPORT_SPECIFIER)) {
                const to = specifier.startsWith('@shared/')
                    ? specifier.slice('@shared/'.length)
                    : localTarget(file, specifier);
                if (to === null) continue;
                if (!forbidden(from, to)) continue;
                violations.push({ file: relative(CONTEXTS_DIR, file), line: index + 1, specifier });
            }
        });
    }

    return violations;
}

describe('couches à l’intérieur d’un contexte', () => {
    it('garde un domaine qui ne connaît que lui-même', () => {
        const offenders = collectLayerViolations((from, to) => from.startsWith('domain/') && !to.startsWith('domain/'));

        // Un domaine qui importe une bibliothèque de persistance, un framework HTTP ou un
        // client de chiffrement n'est plus transposable : il est amarré à son exécution.
        expect(offenders.map(v => `${v.file}:${v.line} → ${v.specifier}`)).toEqual([]);
    });

    it('garde une application qui ignore l’infrastructure', () => {
        const offenders = collectLayerViolations(
            (from, to) => from.startsWith('application/') && to.startsWith('infrastructure/'),
        );

        // Un cas d'usage nomme ce dont il a besoin par un port ; le composition root décide
        // seul quelle implémentation le remplit.
        expect(offenders.map(v => `${v.file}:${v.line} → ${v.specifier}`)).toEqual([]);
    });

    it('n’injecte pas un dépôt dans une route', () => {
        const offenders = collectLayerViolations(
            (from, to) => from.startsWith('infrastructure/http/') && to.startsWith('infrastructure/repository/'),
        );

        // Une route transporte : elle lit une requête, dispatche, rend une réponse. Dès
        // qu'elle tient un dépôt, la règle métier suit — et elle n'a plus de nom.
        expect(offenders.map(v => `${v.file}:${v.line} → ${v.specifier}`)).toEqual([]);
    });
});
