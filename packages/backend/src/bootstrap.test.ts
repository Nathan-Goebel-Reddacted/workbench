import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { EntityManager } from '@mikro-orm/postgresql';
import { bootstrap } from './bootstrap';
import { ILogger } from '@shared/application/port/iLogger';

// Le composition root est le seul endroit du backend qu'aucune erreur ne trahit à temps : un
// nom de commande enregistré deux fois, un cas d'usage ajouté mais jamais câblé, un assemblage
// qui casse à la construction — rien de tout cela n'arrête le compilateur, et tout attend la
// première requête pour se manifester.
//
// `bootstrap()` se contente d'assembler : il construit les dépôts autour de l'EntityManager
// qu'on lui passe, sans jamais l'interroger. Il s'exécute donc entièrement à sec, sans base de
// données, et c'est ce qui rend ce câblage vérifiable ici.

const SRC_DIR = dirname(fileURLToPath(import.meta.url));

const silentLogger: ILogger = { info() {}, warn() {}, error() {} };

function assemble() {
    return bootstrap({} as unknown as EntityManager, silentLogger);
}

describe('composition root', () => {
    it('assemble le conteneur sans conflit', () => {
        // `CommandBus.register()` rejette un nom déjà pris, `ToolRegistry.register()` un outil
        // déjà déclaré : monter l'ensemble suffit à faire parler les deux.
        expect(() => assemble()).not.toThrow();
    });

    it('expose les deux bus et le registre d’outils', () => {
        const container = assemble();

        expect(container.commandBus).toBeDefined();
        expect(container.queryBus).toBeDefined();
        expect(container.toolRegistry).toBeDefined();
        expect(container.agentAuthenticator).toBeDefined();
    });
});

// ── Le câblage de chaque cas d'usage ───────────────────────────────────────────────────
//
// Monter le conteneur prouve que ce qui est enregistré tient debout, pas que tout ce qui
// existe a été enregistré. Une commande écrite, testée, appelée depuis une route mais oubliée
// ici ne se voit qu'au `No handler registered for:` renvoyé à l'utilisateur.

/** `export class XCommand` / `export class XQuery` — un cas d'usage déclaré. */
const DECLARATION = /export class (\w+(?:Command|Query))\b/g;

/** `XCommand.commandName` / `XQuery.queryName` — le même, câblé dans un composition root. */
const WIRING = /(\w+)\.(?:commandName|queryName)\b/g;

/** Les racines qui composent : le serveur HTTP et le serveur MCP. */
const COMPOSITION_ROOTS = ['bootstrap.ts', 'mcp.ts'];

function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
    });
}

/** Le code d'un fichier, ses commentaires de ligne retirés. */
function statements(file: string): string {
    return readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
}

/**
 * Un `register()` mis en commentaire est un câblage retiré : le lire comme un câblage encore
 * en place viderait ce test de son sens, et c'est pourquoi les commentaires sont écartés avant
 * la recherche. Seuls ceux de ligne le sont — un commentaire de bloc échapperait au filtre.
 */
function namesMatching(pattern: RegExp, files: string[]): Set<string> {
    const names = new Set<string>();
    for (const file of files) {
        for (const [, name] of statements(file).matchAll(pattern)) names.add(name);
    }
    return names;
}

describe('câblage des cas d’usage', () => {
    it('n’oublie aucune commande ni requête déclarée', () => {
        const declared = namesMatching(DECLARATION, sourceFiles(join(SRC_DIR, 'contexts')));
        const wired = namesMatching(
            WIRING,
            COMPOSITION_ROOTS.map(root => join(SRC_DIR, root)),
        );

        // Un cas d'usage sans handler n'existe pas : il compile, il se dispatche, et il échoue.
        expect([...declared].filter(name => !wired.has(name)).sort()).toEqual([]);
    });
});
