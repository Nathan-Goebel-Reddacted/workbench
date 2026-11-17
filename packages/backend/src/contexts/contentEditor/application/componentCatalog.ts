import { COMPONENT_KINDS, COMPONENT_REGISTRY, LINK_KIND } from '../domain/component/componentRegistry';
import { MAX_PAGE_HEIGHT, REFERENCE_WIDTH } from '../domain/valueObject/transform';

export type ComponentKindEntry = Readonly<{
    kind: string;
    role: 'content' | 'facet';
    interactive: boolean;
    describe: string;
}>;

export const PAGE_REFERENCE_WIDTH = REFERENCE_WIDTH;
export const PAGE_MAX_HEIGHT = MAX_PAGE_HEIGHT;
export const LINK_COMPONENT_KIND: string = LINK_KIND;

export const COMPONENT_CATALOG: readonly ComponentKindEntry[] = COMPONENT_KINDS.map(kind => ({
    kind,
    role: COMPONENT_REGISTRY[kind].role,
    interactive: COMPONENT_REGISTRY[kind].interactive,
    describe: COMPONENT_REGISTRY[kind].describe,
}));
