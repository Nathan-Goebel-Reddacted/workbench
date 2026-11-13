import { describe, expect, it } from 'vitest';
import type { MikroORM } from '@mikro-orm/postgresql';
import { collectIoTables } from './tableRegistry';

function table(tableName: string) {
    return {
        tableName,
        primaryKeys: ['id'],
        properties: { id: { fieldNames: ['id'] } },
    };
}

function ormWith(...tableNames: string[]) {
    const metadata = Object.fromEntries(tableNames.map(name => [name, table(name)]));
    return { getMetadata: () => ({ getAll: () => metadata }) } as unknown as MikroORM;
}

describe('collectIoTables', () => {
    it('ne transporte pas l’ouverture du site public d’une base à l’autre', () => {
        const names = collectIoTables(ormWith('cvs', 'site_access')).map(t => t.tableName);
        expect(names).toEqual(['cvs']);
    });
});
