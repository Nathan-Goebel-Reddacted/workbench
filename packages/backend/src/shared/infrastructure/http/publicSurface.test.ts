import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

// Les routes publiques sont la surface d'attaque de l'application : atteignables sans
// session, par n'importe qui. Chacune doit porter un plafond d'appels.
//
// Ce test lit le code source plutôt que les routes montées, parce qu'il doit échouer au
// moment où quelqu'un ajoute `public: true` quelque part — pas seulement quand l'application
// démarre avec une base.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Les deux seules routes publiques sans plafond, et pourquoi :
 *  - `/health` est une sonde d'infrastructure. La brider, c'est déclarer l'application morte
 *    au redémarreur au moment précis où il la sollicite le plus.
 *  - `/uploads/*` sert des fichiers statiques. Une page qui en affiche vingt ferait vingt
 *    requêtes, et un plafond les transformerait en images cassées.
 */
const EXEMPT = ['/health', '/uploads'];

function sourceFiles(directory: string = SRC): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
    });
}

describe('surface publique', () => {
    it('plafonne chaque route déclarée publique', () => {
        const unguarded: string[] = [];

        for (const path of sourceFiles()) {
            const source = readFileSync(path, 'utf8');
            const lines = source.split(/\r?\n/);

            lines.forEach((line, index) => {
                if (!line.includes('public: true')) return;
                // Les commentaires qui citent le drapeau ne le déclarent pas.
                if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
                // La déclaration et son plafond tiennent sur le même objet `config`, donc
                // sur la même ligne ou la suivante selon le formatage de prettier.
                const window = [line, lines[index + 1] ?? ''].join(' ');
                if (window.includes('rateLimit')) return;
                if (EXEMPT.some(route => window.includes(route) || line.includes(route))) return;
                // L'estampillage du plugin statique, couvert par l'exemption `/uploads`.
                if (window.includes('route.config')) return;
                unguarded.push(`${relative(SRC, path)}:${index + 1}`);
            });
        }

        expect(unguarded).toEqual([]);
    });
});
