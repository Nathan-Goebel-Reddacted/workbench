import { describe, expect, it } from 'vitest';
import { SetSiteAccessHandler } from './setSiteAccessHandler';
import { SetSiteAccessCommand } from './setSiteAccessCommand';
import { SiteAccess } from '../../../domain/siteAccessAggregate';
import type { ISiteAccessRepository } from '../../../domain/repository/iSiteAccessRepository';

function repository(stored: SiteAccess) {
    const saved: boolean[] = [];
    const repo: ISiteAccessRepository = {
        get: async () => stored,
        save: async access => void saved.push(access.isOpen()),
    };
    return { repo, saved };
}

describe('SetSiteAccessHandler', () => {
    it('ouvre le site', async () => {
        const { repo, saved } = repository(SiteAccess.closed());
        await new SetSiteAccessHandler(repo).handle(new SetSiteAccessCommand(true));
        expect(saved).toEqual([true]);
    });

    it('ferme le site', async () => {
        const { repo, saved } = repository(new SiteAccess(true));
        await new SetSiteAccessHandler(repo).handle(new SetSiteAccessCommand(false));
        expect(saved).toEqual([false]);
    });
});
