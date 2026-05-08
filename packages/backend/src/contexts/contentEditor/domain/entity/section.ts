import { SectionId } from "../valueObject/sectionId";
import { SectionType } from "../valueObject/sectionType";
import { ContentRef } from "../valueObject/contentRef";
import { GridPosition } from "../valueObject/gridPosition";

export class Section {
    private readonly id: SectionId;
    private readonly type: SectionType;
    private readonly contentRef: ContentRef;
    private position: GridPosition;

    constructor(
        id: SectionId,
        type: SectionType,
        contentRef: ContentRef,
        position: GridPosition
    ) {
        this.id = id;
        this.type = type;
        this.contentRef = contentRef;
        this.position = position;
    }

    getId(): SectionId {
        return this.id;
    }

    getType(): SectionType {
        return this.type;
    }

    getContentRef(): ContentRef {
        return this.contentRef;
    }

    getPosition(): GridPosition {
        return this.position;
    }

    moveTo(position: GridPosition): void {
        this.position = position;
    }
}
