import { describe, expect, it } from 'vitest';
import { EnsurePageLayoutHandler } from './ensurePageLayoutHandler.js';
import { EnsurePageLayoutCommand } from './ensurePageLayoutCommand.js';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository.js';
import { PageLayoutFactory } from '../../../domain/factory/pageLayoutFactory.js';
import { PageLayout } from '../../../domain/pageLayoutAggregate.js';
import { PageLayoutId } from '../../../domain/valueObject/pageLayoutId.js';
import { PageRef } from '../../../domain/valueObject/pageRef.js';
import { PageType } from '../../../domain/valueObject/pageType.js';

class InMemoryPageLayoutRepository implements IPageLayoutRepository {
    readonly saved: PageLayout[] = [];

    async findById(id: PageLayoutId): Promise<PageLayout | null> {
        return this.saved.find(l => l.getId().equals(id)) ?? null;
    }

    async findByRef(pageType: PageType, pageRef: PageRef): Promise<PageLayout | null> {
        return this.saved.find(l => l.getPageType() === pageType && l.getPageRef().equals(pageRef)) ?? null;
    }

    async save(pageLayout: PageLayout): Promise<void> {
        this.saved.push(pageLayout);
    }
}

describe('EnsurePageLayoutHandler', () => {
    const pageRef = crypto.randomUUID();

    it('creates the layout of a page that has none', async () => {
        const repository = new InMemoryPageLayoutRepository();
        const handler = new EnsurePageLayoutHandler(repository, new PageLayoutFactory());

        await handler.handle(new EnsurePageLayoutCommand(crypto.randomUUID(), PageType.PORTFOLIO, pageRef));

        expect(repository.saved).toHaveLength(1);
    });

    it('keeps the existing layout of a page', async () => {
        const repository = new InMemoryPageLayoutRepository();
        const handler = new EnsurePageLayoutHandler(repository, new PageLayoutFactory());

        await handler.handle(new EnsurePageLayoutCommand(crypto.randomUUID(), PageType.PORTFOLIO, pageRef));
        await handler.handle(new EnsurePageLayoutCommand(crypto.randomUUID(), PageType.PORTFOLIO, pageRef));

        expect(repository.saved).toHaveLength(1);
    });
});
