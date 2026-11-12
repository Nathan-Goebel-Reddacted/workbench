import { describe, expect, it } from 'vitest';
import { GetPageLayoutByRefHandler } from './getPageLayoutByRefHandler.js';
import { GetPageLayoutByRefQuery } from './getPageLayoutByRefQuery.js';
import { PageLayout } from '../../../domain/pageLayoutAggregate.js';
import { PageLayoutId } from '../../../domain/valueObject/pageLayoutId.js';
import { PageRef } from '../../../domain/valueObject/pageRef.js';
import { PageType } from '../../../domain/valueObject/pageType.js';
import type { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository.js';
import type { IPageVisibility } from '../../../domain/port/iPageVisibility.js';

// La route `/page-layouts/by-ref` est ouverte : c'est ainsi que le site public compose ses
// pages. Elle rendait pourtant le layout sans demander si la page était publique — le contenu
// d'un projet masqué restait lisible à qui connaissait son identifiant, alors que
// `/projects/:id` le refusait déjà. Le layout suit désormais la page qu'il habille.

const PAGE_REF = '22222222-2222-4222-8222-222222222222';

const layout = new PageLayout(new PageLayoutId(), PageType.PROJECT, new PageRef(PAGE_REF));

function repository() {
    const asked: PageRef[] = [];
    const repo: IPageLayoutRepository = {
        findById: async () => null,
        findByRef: async (_pageType, pageRef) => {
            asked.push(pageRef);
            return layout;
        },
        save: async () => {},
    };
    return { repo, asked };
}

function visibility(isPublic: boolean): IPageVisibility {
    return { isPublic: async () => isPublic };
}

describe('GetPageLayoutByRefHandler', () => {
    it('rend le layout d’une page publique', async () => {
        const handler = new GetPageLayoutByRefHandler(repository().repo, visibility(true));

        const dto = await handler.handle(new GetPageLayoutByRefQuery('project', PAGE_REF));

        expect(dto?.pageRef).toBe(PAGE_REF);
    });

    it('tait le layout d’une page masquée sans même le charger', async () => {
        const { repo, asked } = repository();
        const handler = new GetPageLayoutByRefHandler(repo, visibility(false));

        const dto = await handler.handle(new GetPageLayoutByRefQuery('project', PAGE_REF));

        expect(dto).toBeNull();
        expect(asked).toEqual([]);
    });

    it('rend le layout d’une page masquée à qui a la lecture privée', async () => {
        const handler = new GetPageLayoutByRefHandler(repository().repo, visibility(false));

        const dto = await handler.handle(new GetPageLayoutByRefQuery('project', PAGE_REF, true));

        expect(dto?.pageRef).toBe(PAGE_REF);
    });

    it('refuse un type de page inconnu', async () => {
        const handler = new GetPageLayoutByRefHandler(repository().repo, visibility(true));

        await expect(handler.handle(new GetPageLayoutByRefQuery('galerie', PAGE_REF))).rejects.toThrow();
    });
});
