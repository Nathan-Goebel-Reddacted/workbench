import { EntityManager } from '@mikro-orm/postgresql';
import { IPageLayoutRepository } from '../../domain/repository/iPageLayoutRepository';
import { PageLayout } from '../../domain/pageLayoutAggregate';
import { PageLayoutOrmEntity } from '../entity/pageLayoutOrmEntity';
import { PageLayoutId } from '../../domain/valueObject/pageLayoutId';
import { PageType } from '../../domain/valueObject/pageType';
import { PageRef } from '../../domain/valueObject/pageRef';
import { Section } from '../../domain/entity/section';
import { SectionId } from '../../domain/valueObject/sectionId';
import { SectionType } from '../../domain/valueObject/sectionType';
import { ContentRef } from '../../domain/valueObject/contentRef';
import { GridPosition } from '../../domain/valueObject/gridPosition';

export class PageLayoutRepository implements IPageLayoutRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<PageLayout | null> {
        const e = await this.em.findOne(PageLayoutOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByRef(pageType: string, pageRef: string): Promise<PageLayout | null> {
        const e = await this.em.findOne(PageLayoutOrmEntity, { pageType, pageRef });
        return e ? this.toDomain(e) : null;
    }

    async save(pageLayout: PageLayout): Promise<void> {
        await this.em.transactional(async (em) => {
            await em.upsert(PageLayoutOrmEntity, this.toOrm(pageLayout));
        });
    }

    private toDomain(e: PageLayoutOrmEntity): PageLayout {
        const sections = e.sections.map(s => new Section(
            new SectionId(s.id),
            s.type as SectionType,
            new ContentRef(s.contentRef),
            new GridPosition(s.column, s.order),
        ));
        return new PageLayout(
            new PageLayoutId(e.id),
            e.pageType as PageType,
            new PageRef(e.pageRef),
            sections,
        );
    }

    private toOrm(pageLayout: PageLayout): PageLayoutOrmEntity {
        const e = new PageLayoutOrmEntity();
        e.id = pageLayout.getId().getValue();
        e.pageType = pageLayout.getPageType();
        e.pageRef = pageLayout.getPageRef().getValue();
        e.sections = pageLayout.getSections().map(s => ({
            id: s.getId().getValue(),
            type: s.getType(),
            contentRef: s.getContentRef().getValue(),
            column: s.getPosition().getColumn(),
            order: s.getPosition().getOrder(),
        }));
        return e;
    }
}
