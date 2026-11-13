import { describe, expect, it } from 'vitest';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SiteAccessRepository } from './siteAccessRepository';

function repositoryReading(row: { id: string; open: boolean } | null) {
    return new SiteAccessRepository({ findOne: async () => row } as unknown as EntityManager);
}

describe('SiteAccessRepository', () => {
    it('ferme le site tant qu’aucun réglage n’est enregistré', async () => {
        expect((await repositoryReading(null).get()).isOpen()).toBe(false);
    });

    it('relit le réglage enregistré', async () => {
        expect((await repositoryReading({ id: 'public-site', open: true }).get()).isOpen()).toBe(true);
    });
});
