import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

// Une route servie quand le site public est fermé reste une fuite possible pendant toute la
// fermeture : la liste est figée ici, pour qu'un ajout se voie en revue.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const EXPECTED = [
    'contexts/ai-assistant/infrastructure/http/pairingRoutes.ts',
    'contexts/ai-assistant/infrastructure/http/pairingRoutes.ts',
    'contexts/ai-assistant/infrastructure/mcp/mcpRoutes.ts',
    'contexts/auth/infrastructure/http/authRoutes.ts',
    'contexts/auth/infrastructure/http/authRoutes.ts',
    'contexts/errorLog/infrastructure/http/errorLogRoutes.ts',
    'contexts/site/infrastructure/http/siteRoutes.ts',
    'contexts/theme/infrastructure/http/themeRoutes.ts',
    'shared/infrastructure/http/server.ts',
];

function sourceFiles(directory: string = SRC): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
    });
}

describe('surface servie site fermé', () => {
    it('se limite à la connexion, aux agents, au journal, aux thèmes et à l’état du site', () => {
        const declarations = sourceFiles().flatMap(path =>
            readFileSync(path, 'utf8')
                .split(/\r?\n/)
                .filter(line => line.includes('servedWhenSiteClosed: true'))
                .map(() => relative(SRC, path).replaceAll('\\', '/')),
        );

        expect(declarations.sort()).toEqual(EXPECTED);
    });
});
