import { SectionId } from '../valueObject/sectionId';
import { SectionType } from '../valueObject/sectionType';
import { ContentRef } from '../valueObject/contentRef';
import { GridPosition } from '../valueObject/gridPosition';

export type SectionContent = Record<string, unknown>;

export class Section {
    private readonly id: SectionId;
    private readonly type: SectionType;
    private contentRef: ContentRef | null;
    private content: SectionContent;
    private position: GridPosition;

    constructor(
        id: SectionId,
        type: SectionType,
        contentRef: ContentRef | null,
        content: SectionContent,
        position: GridPosition,
    ) {
        this.id = id;
        this.type = type;
        this.contentRef = contentRef;
        this.content = content;
        this.position = position;
    }

    getId(): SectionId {
        return this.id;
    }

    getType(): SectionType {
        return this.type;
    }

    getContentRef(): ContentRef | null {
        return this.contentRef;
    }

    getContent(): SectionContent {
        return this.content;
    }

    getPosition(): GridPosition {
        return this.position;
    }

    moveTo(position: GridPosition): void {
        this.position = position;
    }

    updateContent(content: SectionContent, contentRef: ContentRef | null): void {
        this.content = content;
        this.contentRef = contentRef;
    }
}
