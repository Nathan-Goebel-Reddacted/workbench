import { SectionId } from '../valueObject/sectionId';
import { SectionType } from '../valueObject/sectionType';
import { GridPosition } from '../valueObject/gridPosition';
import { SectionContent } from '../valueObject/sectionContent/sectionContent';

export class Section {
    private readonly id: SectionId;
    private readonly type: SectionType;
    private content: SectionContent;
    private position: GridPosition;

    constructor(id: SectionId, type: SectionType, content: SectionContent, position: GridPosition) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.position = position;
    }

    getId(): SectionId {
        return this.id;
    }

    getType(): SectionType {
        return this.type;
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

    updateContent(raw: Record<string, unknown>): void {
        this.content = SectionContent.fromInput(this.type, raw);
    }
}
