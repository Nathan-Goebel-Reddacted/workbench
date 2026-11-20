import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MetadataStorage, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { UPLOAD_REFERENCE_SOURCES } from './uploadReferenceSources.js';

// Le balayage des fichiers orphelins efface au démarrage tout upload qu'aucune source déclarée
// ne cite. Une colonne JSON qui cite des fichiers sans être déclarée les perd donc, sans retour
// possible. Chaque colonne JSON est soit une source, soit une exclusion dont on dit pourquoi.

const NOT_UPLOAD_SOURCES: Record<string, string> = {
    'agent_pairing_requests.requested_scopes': 'scope names',
    'agent_tools.scopes': 'scope names',
    'contact_messages.fields': 'what a visitor typed, never rendered as a file',
    'error_log_entries.context': 'diagnostic context',
    'portfolios.languages': 'language names',
    'themes.colors': 'color values',
    'users.roles': 'role names',
};

const CONTEXTS = join(dirname(fileURLToPath(import.meta.url)), 'contexts');

async function loadEntities(): Promise<void> {
    const files = readdirSync(CONTEXTS).flatMap(context => {
        const directory = join(CONTEXTS, context, 'infrastructure', 'entity');
        try {
            return readdirSync(directory)
                .filter(name => name.endsWith('.ts'))
                .map(name => join(directory, name));
        } catch {
            return [];
        }
    });
    await Promise.all(files.map(file => import(pathToFileURL(file).href)));
}

async function jsonColumns(): Promise<string[]> {
    await loadEntities();
    const naming = new UnderscoreNamingStrategy();
    return Object.values(MetadataStorage.getMetadata()).flatMap(meta => {
        const table = meta.tableName ?? naming.classToTableName(meta.className);
        return Object.values(meta.properties ?? {})
            .filter(prop => /json/i.test(String(prop.type)))
            .map(prop => `${table}.${prop.fieldNames?.[0] ?? naming.propertyToColumnName(prop.name)}`);
    });
}

describe('sources de références d’uploads', () => {
    it('déclare ou exclut explicitement chaque colonne JSON', async () => {
        const declared = new Set(UPLOAD_REFERENCE_SOURCES.map(({ table, column }) => `${table}.${column}`));

        const columns = await jsonColumns();
        const forgotten = columns.filter(column => !declared.has(column) && !(column in NOT_UPLOAD_SOURCES));

        expect(columns).toContain('pages.elements');
        expect(forgotten).toEqual([]);
    });
});
