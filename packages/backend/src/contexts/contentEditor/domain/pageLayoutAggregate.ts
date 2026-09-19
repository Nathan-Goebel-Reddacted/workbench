import { PageLayoutId } from './valueObject/pageLayoutId';
import { PageType } from './valueObject/pageType';
import { PageRef } from './valueObject/pageRef';
import { SectionId } from './valueObject/sectionId';
import { GridPosition } from './valueObject/gridPosition';
import { Section } from './entity/section';
import { SectionType } from './valueObject/sectionType';
import { SectionTypeNotAllowedException } from './exception/sectionTypeNotAllowed';

const DEFAULT_SECTION_WIDTH = 4;
const DEFAULT_SECTION_HEIGHT = 3;

const SHARED_SECTION_TYPES: readonly SectionType[] = [
    SectionType.TEXT,
    SectionType.DOCUMENT,
    SectionType.CODE,
    SectionType.LINK,
    SectionType.EMBED,
    SectionType.CAROUSEL,
    SectionType.BACKGROUND,
    SectionType.CONTACT_FORM,
    SectionType.LINK_AREA,
];

const ALLOWED_SECTION_TYPES: Record<PageType, readonly SectionType[]> = {
    [PageType.PORTFOLIO]: SHARED_SECTION_TYPES,
    [PageType.PROJECT]: [...SHARED_SECTION_TYPES, SectionType.PROJECT_CARD],
};

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

    allowedSectionTypes(): SectionType[] {
        return [...ALLOWED_SECTION_TYPES[this.pageType]];
    }

    addSection(section: Section): void {
        if (!ALLOWED_SECTION_TYPES[this.pageType].includes(section.getType())) {
            throw new SectionTypeNotAllowedException(section.getType(), this.pageType);
        }
        this.sections.push(section);
    }

    nextFreePosition(): GridPosition {
        const bottom = this.sections.reduce(
            (max, s) => Math.max(max, s.getPosition().getY() + s.getPosition().getH()),
            0,
        );
        return new GridPosition(0, bottom, DEFAULT_SECTION_WIDTH, DEFAULT_SECTION_HEIGHT);
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

    updateSectionContent(sectionId: SectionId, content: Record<string, unknown>): void {
        const section = this.sections.find(s => s.getId().equals(sectionId));
        if (section) {
            section.updateContent(content);
        }
    }
}
