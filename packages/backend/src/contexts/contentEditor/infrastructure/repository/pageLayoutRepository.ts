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
import { GridPosition } from '../../domain/valueObject/gridPosition';
import { SectionContent } from '../../domain/valueObject/sectionContent/sectionContent';

export class PageLayoutRepository implements IPageLayoutRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: PageLayoutId): Promise<PageLayout | null> {
        const e = await this.em.findOne(PageLayoutOrmEntity, { id: id.getValue() });
        return e ? this.toDomain(e) : null;
    }

    async findByRef(pageType: PageType, pageRef: PageRef): Promise<PageLayout | null> {
        const e = await this.em.findOne(PageLayoutOrmEntity, { pageType, pageRef: pageRef.getValue() });
        return e ? this.toDomain(e) : null;
    }

    async save(pageLayout: PageLayout): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(PageLayoutOrmEntity, this.toOrm(pageLayout));
        });
    }

    private toDomain(e: PageLayoutOrmEntity): PageLayout {
        const sections = e.sections.map(s => {
            const type = s.type as SectionType;
            return new Section(
                new SectionId(s.id),
                type,
                SectionContent.rehydrate(type, s.content ?? {}),
                new GridPosition(s.x, s.y, s.w, s.h),
            );
        });
        return new PageLayout(new PageLayoutId(e.id), e.pageType as PageType, new PageRef(e.pageRef), sections);
    }

    private toOrm(pageLayout: PageLayout): PageLayoutOrmEntity {
        const e = new PageLayoutOrmEntity();
        e.id = pageLayout.getId().getValue();
        e.pageType = pageLayout.getPageType();
        e.pageRef = pageLayout.getPageRef().getValue();
        e.sections = pageLayout.getSections().map(s => ({
            id: s.getId().getValue(),
            type: s.getType(),
            content: s.getContent().toRecord(),
            x: s.getPosition().getX(),
            y: s.getPosition().getY(),
            w: s.getPosition().getW(),
            h: s.getPosition().getH(),
        }));
        return e;
    }
}
