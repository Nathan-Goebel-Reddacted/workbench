import { SectionType } from '../sectionType';
import { ContentReader } from './contentReader';
import { SECTION_CONTENT_SCHEMAS } from './sectionContentSchemas';

type Raw = Record<string, unknown>;

export class SectionContent {
    private readonly value: Raw;

    private constructor(value: Raw) {
        this.value = value;
    }

    static fromInput(type: SectionType, raw: Raw): SectionContent {
        return SectionContent.normalize(type, raw, true);
    }

    static rehydrate(type: SectionType, raw: Raw): SectionContent {
        return SectionContent.normalize(type, raw, false);
    }

    static initial(type: SectionType): SectionContent {
        return SectionContent.fromInput(type, {});
    }

    toRecord(): Raw {
        return structuredClone(this.value);
    }

    private static normalize(type: SectionType, raw: Raw, strict: boolean): SectionContent {
        const schema = SECTION_CONTENT_SCHEMAS[type];
        if (!schema) return new SectionContent(structuredClone(raw));
        return new SectionContent(schema(new ContentReader(raw, strict, type)));
    }
}
