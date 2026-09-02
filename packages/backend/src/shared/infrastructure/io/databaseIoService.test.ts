import { describe, expect, it } from 'vitest';
import { buildImportScript, buildUpsert, parseReport, redirectToStaging } from './databaseIoService.js';
import type { IoTable } from './tableRegistry.js';

const projects: IoTable = {
    tableName: 'projects',
    primaryKeys: ['id'],
    columns: ['id', 'title', 'visible'],
};

const tables = new Map<string, IoTable>([['projects', projects]]);

// redirectToStaging décide, ligne à ligne, ce qui part dans le schéma de transit. Une ligne
// laissée en `public` écrit droit dans la table réelle, sans le ON CONFLICT : c'est un import
// brut déguisé en upsert, et rien dans le rapport ne le signale.
describe('redirectToStaging', () => {
    it('redirige un COPY vers le schéma de transit', () => {
        const dump = 'COPY public.projects (id, title, visible) FROM stdin;\n1\tAtelier\tt\n\\.\n';

        expect(redirectToStaging(dump, tables)).toContain('COPY "io_staging".projects');
    });

    it('redirige aussi la forme INSERT', () => {
        const dump = "INSERT INTO public.projects (id, title) VALUES (1, 'Atelier');\n";

        expect(redirectToStaging(dump, tables)).toContain('INSERT INTO "io_staging".projects');
    });

    it('accepte le nom de table entre guillemets', () => {
        const dump = 'COPY "public"."projects" (id) FROM stdin;\n1\n\\.\n';

        expect(redirectToStaging(dump, tables)).toContain('"io_staging".');
    });

    it('ne touche pas à une ligne de données qui commence par le mot COPY', () => {
        // Le corps d'un COPY est du TSV brut : cette ligne EST une donnée, pas une instruction.
        const dump = [
            'COPY public.projects (id, title, visible) FROM stdin;',
            '1\tCOPY public.projects\tt',
            '\\.',
            '',
        ].join('\n');

        const out = redirectToStaging(dump, tables);

        expect(out).toContain('1\tCOPY public.projects\tt');
        expect(out.split('\n').filter(line => line.includes('io_staging'))).toHaveLength(1);
    });

    it('reprend la redirection après la fin d’un bloc COPY', () => {
        const dump = [
            'COPY public.projects (id) FROM stdin;',
            '1',
            '\\.',
            'COPY public.projects (id) FROM stdin;',
            '2',
            '\\.',
            '',
        ].join('\n');

        expect(redirectToStaging(dump, tables).split('io_staging').length - 1).toBe(2);
    });

    it('refuse un dump qui porte une table sans entité', () => {
        const dump = 'COPY public.legacy_stuff (id) FROM stdin;\n1\n\\.\n';

        expect(() => redirectToStaging(dump, tables)).toThrow(/legacy_stuff/);
    });

    it('laisse passer les lignes qui ne sont ni COPY ni INSERT', () => {
        const dump = 'SET statement_timeout = 0;\n-- un commentaire\n';

        expect(redirectToStaging(dump, tables)).toBe(dump);
    });
});

describe('buildUpsert', () => {
    it('met à jour toutes les colonnes hors clé primaire', () => {
        const sql = buildUpsert(projects);

        expect(sql).toContain('ON CONFLICT ("id") DO UPDATE SET');
        expect(sql).toContain('"title" = EXCLUDED."title"');
        expect(sql).toContain('"visible" = EXCLUDED."visible"');
        expect(sql).not.toContain('"id" = EXCLUDED."id"');
    });

    it('ne fait rien quand la table n’est qu’une clé primaire', () => {
        const joinTable: IoTable = {
            tableName: 'project_tags',
            primaryKeys: ['project_id', 'tag_id'],
            columns: ['project_id', 'tag_id'],
        };

        expect(buildUpsert(joinTable)).toContain('DO NOTHING');
    });

    it('distingue insertions et mises à jour par xmax', () => {
        // `xmax = 0` est vrai pour une ligne réellement insérée : c'est ce qui permet de compter
        // les deux branches sans relire la table.
        expect(buildUpsert(projects)).toContain('(xmax = 0) AS was_inserted');
    });

    it('échappe les identifiants', () => {
        const odd: IoTable = { tableName: 'weird"name', primaryKeys: ['id'], columns: ['id'] };

        expect(buildUpsert(odd)).toContain('"weird""name"');
    });
});

describe('parseReport', () => {
    it('lit la dernière ligne JSON de la sortie psql', () => {
        const output = [
            'SET',
            'CREATE SCHEMA',
            '[{"table_name":"projects","inserted":2,"updated":1}]',
            'DROP SCHEMA',
        ].join('\n');

        expect(parseReport(output)).toEqual([{ table_name: 'projects', inserted: 2, updated: 1 }]);
    });

    it('rend une liste vide quand psql n’a rien renvoyé d’exploitable', () => {
        expect(parseReport('ERROR:  relation does not exist')).toEqual([]);
        expect(parseReport('')).toEqual([]);
    });
});

describe('buildImportScript', () => {
    const dump = 'COPY public.projects (id, title, visible) FROM stdin;\n1\tAtelier\tt\n\\.\n';

    it('nettoie le schéma de transit lors d’un import réel', () => {
        const script = buildImportScript([projects], dump);

        expect(script).toContain('DROP SCHEMA "io_staging" CASCADE;');
        expect(script).not.toContain('ROLLBACK;');
    });

    it('annule tout en simulation, une fois le rapport lu', () => {
        const script = buildImportScript([projects], dump, true);
        const reportAt = script.indexOf('_report r;');
        const rollbackAt = script.indexOf('ROLLBACK;');

        expect(rollbackAt).toBeGreaterThan(reportAt);
        // Le schéma de transit disparaît avec la transaction annulée.
        expect(script).not.toContain('DROP SCHEMA "io_staging" CASCADE;');
    });

    it('produit le même travail dans les deux modes, à la dernière instruction près', () => {
        const real = buildImportScript([projects], dump).split('\n');
        const dry = buildImportScript([projects], dump, true).split('\n');

        expect(dry.slice(0, -1)).toEqual(real.slice(0, -1));
    });
});
