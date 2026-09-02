import { PageLayoutId } from './valueObject/pageLayoutId';
import { PageType } from './valueObject/pageType';
import { PageRef } from './valueObject/pageRef';
import { SectionId } from './valueObject/sectionId';
import { GridPosition } from './valueObject/gridPosition';
import { ContentRef } from './valueObject/contentRef';
import { Section, SectionContent } from './entity/section';

export class PageLayout {
    private readonly id: PageLayoutId;
    private readonly pageType: PageType;
    private readonly pageRef: PageRef;
    private sections: Section[];

    constructor(id: PageLayoutId, pageType: PageType, pageRef: PageRef, sections: Section[] = []) {
        this.id = id;
        this.pageType = pageType;
        this.pageRef = pageRef;
        this.sections = sections;
    }

    getId(): PageLayoutId {
        return this.id;
    }

    getPageType(): PageType {
        return this.pageType;
    }

    getPageRef(): PageRef {
        return this.pageRef;
    }

    getSections(): Section[] {
        return [...this.sections];
    }

    addSection(section: Section): void {
        this.sections.push(section);
    }

    removeSection(sectionId: SectionId): void {
        this.sections = this.sections.filter(s => !s.getId().equals(sectionId));
    }

    moveSection(sectionId: SectionId, newPosition: GridPosition): void {
        const section = this.sections.find(s => s.getId().equals(sectionId));
        if (section) {
            section.moveTo(newPosition);
        }
    }

    updateSectionContent(sectionId: SectionId, content: SectionContent, contentRef: ContentRef | null): void {
        const section = this.sections.find(s => s.getId().equals(sectionId));
        if (section) {
            section.updateContent(content, contentRef);
        }
    }
}
