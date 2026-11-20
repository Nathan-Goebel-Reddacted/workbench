import { EntityManager, UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { IPageRepository, PageVersionConflictError } from '../../domain/repository/iPageRepository';
import { Page } from '../../domain/pageAggregate';
import { Element } from '../../domain/entity/element';
import { PageId } from '../../domain/valueObject/pageId';
import { PageRef } from '../../domain/valueObject/pageRef';
import { PageType } from '../../domain/valueObject/pageType';
import { ElementId } from '../../domain/valueObject/elementId';
import { Transform } from '../../domain/valueObject/transform';
import { Layout, Placement } from '../../domain/valueObject/layout';
import { SCREENS, ScreenSize, isScreenSize } from '../../domain/valueObject/screenSize';
import { ElementRow, PageOrmEntity, PlacementRow } from '../entity/pageOrmEntity';

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
            Element.rehydrate(new ElementId(e.id), layoutOf(e.layout), e.components ?? {}),
        );
        return new Page(new PageId(row.id), row.pageType as PageType, new PageRef(row.pageRef), elements, row.version);
    }
}

function layoutOf(row: ElementRow['layout']): Layout {
    const placements = {} as Record<ScreenSize, Placement>;
    for (const screen of SCREENS) {
        const { transform: t, hidden } = row[screen];
        placements[screen] = { transform: Transform.clamped(screen, t.x, t.y, t.w, t.h), hidden };
    }
    return Layout.of(placements, row.origin && isScreenSize(row.origin) ? row.origin : 'desktop');
}

function placementRow({ transform: t, hidden }: Placement): PlacementRow {
    return { transform: { x: t.getX(), y: t.getY(), w: t.getW(), h: t.getH() }, hidden };
}

function toRow(element: Element): ElementRow {
    const layout = element.getLayout();
    return {
        id: element.getId().getValue(),
        layout: {
            desktop: placementRow(layout.placement('desktop')),
            tablet: placementRow(layout.placement('tablet')),
            mobile: placementRow(layout.placement('mobile')),
            origin: layout.getOrigin(),
        },
        components: element.getComponents(),
    };
}
