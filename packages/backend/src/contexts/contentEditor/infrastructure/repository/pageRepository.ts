import { EntityManager, UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { IPageRepository, PageVersionConflictError } from '../../domain/repository/iPageRepository';
import { Page } from '../../domain/pageAggregate';
import { Element } from '../../domain/entity/element';
import { PageId } from '../../domain/valueObject/pageId';
import { PageRef } from '../../domain/valueObject/pageRef';
import { PageType } from '../../domain/valueObject/pageType';
import { ElementId } from '../../domain/valueObject/elementId';
import { Transform } from '../../domain/valueObject/transform';
import { ElementRow, PageOrmEntity } from '../entity/pageOrmEntity';

export class PageRepository implements IPageRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: PageId): Promise<Page | null> {
        const row = await this.em.findOne(PageOrmEntity, { id: id.getValue() }, { disableIdentityMap: true });
        return row ? this.toDomain(row) : null;
    }

    async findByRef(pageType: PageType, pageRef: PageRef): Promise<Page | null> {
        const row = await this.em.findOne(
            PageOrmEntity,
            { pageType, pageRef: pageRef.getValue() },
            { disableIdentityMap: true },
        );
        return row ? this.toDomain(row) : null;
    }

    async findByRefs(pageType: PageType, pageRefs: readonly PageRef[]): Promise<Page[]> {
        if (pageRefs.length === 0) return [];
        const rows = await this.em.find(
            PageOrmEntity,
            { pageType, pageRef: { $in: pageRefs.map(ref => ref.getValue()) } },
            { disableIdentityMap: true },
        );
        return rows.map(row => this.toDomain(row));
    }

    async save(page: Page): Promise<void> {
        const id = page.getId().getValue();
        const elements = page.getElements().map(toRow);

        if (page.getVersion() === 0) {
            try {
                await this.em.insert(PageOrmEntity, {
                    id,
                    pageType: page.getPageType(),
                    pageRef: page.getPageRef().getValue(),
                    elements,
                    version: 1,
                });
            } catch (error) {
                if (error instanceof UniqueConstraintViolationException) throw new PageVersionConflictError(id);
                throw error;
            }
            return;
        }

        const updated = await this.em.nativeUpdate(
            PageOrmEntity,
            { id, version: page.getVersion() },
            { elements, version: page.getVersion() + 1 },
        );
        if (updated === 0) throw new PageVersionConflictError(id);
    }

    private toDomain(row: PageOrmEntity): Page {
        const elements = row.elements.map(e =>
            Element.rehydrate(
                new ElementId(e.id),
                new Transform(e.transform.x, e.transform.y, e.transform.w, e.transform.h),
                e.components ?? {},
            ),
        );
        return new Page(new PageId(row.id), row.pageType as PageType, new PageRef(row.pageRef), elements, row.version);
    }
}

function toRow(element: Element): ElementRow {
    const t = element.getTransform();
    return {
        id: element.getId().getValue(),
        transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() },
        components: element.getComponents(),
    };
}
