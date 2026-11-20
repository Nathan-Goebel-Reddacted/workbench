import { describe, expect, it } from 'vitest';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PageRepository } from './pageRepository.js';
import { PageId } from '../../domain/valueObject/pageId.js';
import type { PageOrmEntity } from '../entity/pageOrmEntity.js';

const PAGE = '11111111-1111-4111-8111-111111111111';
const ELEMENT = '33333333-3333-4333-8333-333333333333';

function repositoryReturning(row: PageOrmEntity): PageRepository {
    const em = { findOne: async () => row } as unknown as EntityManager;
    return new PageRepository(em);
}

describe('PageRepository', () => {
    it('reads placements stored wider than their screen size, pulled back inside it', async () => {
        const row = {
            id: PAGE,
            pageType: 'portfolio',
            pageRef: '22222222-2222-4222-8222-222222222222',
            version: 3,
            elements: [
                {
                    id: ELEMENT,
                    layout: {
                        desktop: { transform: { x: 1200, y: 40, w: 240, h: 80 }, hidden: false },
                        tablet: { transform: { x: 0, y: 40, w: 768, h: 80 }, hidden: false },
                        mobile: { transform: { x: 16, y: 40, w: 343, h: 80 }, hidden: true },
                        origin: 'desktop',
                    },
                    components: {},
                },
            ],
        } as unknown as PageOrmEntity;

        const page = await repositoryReturning(row).findById(new PageId(PAGE));

        const layout = page!.getElements()[0].getLayout();
        const desktop = layout.placement('desktop').transform;
        const mobile = layout.placement('mobile');
        expect([desktop.getX(), desktop.getW()]).toEqual([1040, 240]);
        expect([mobile.transform.getX(), mobile.transform.getW(), mobile.hidden]).toEqual([16, 343, true]);
        expect(layout.placement('tablet').transform.getW()).toBe(768);
    });
});
