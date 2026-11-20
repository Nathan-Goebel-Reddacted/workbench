import { COMPONENT_KINDS, COMPONENT_REGISTRY, LINK_KIND } from '../domain/component/componentRegistry';
import { DERIVED_SCREENS, MAX_SCREEN_HEIGHTS, SCREEN_SIZES, SCREENS } from '../domain/valueObject/screenSize';

export type ComponentKindEntry = Readonly<{
    kind: string;
    role: 'content' | 'facet';
    interactive: boolean;
    describe: string;
}>;

export const PAGE_SCREENS = SCREENS;
export const PAGE_DERIVED_SCREENS = DERIVED_SCREENS;
export const PAGE_SCREEN_WIDTHS = SCREEN_SIZES;
export const PAGE_SCREEN_MAX_HEIGHTS = MAX_SCREEN_HEIGHTS;
export const LINK_COMPONENT_KIND: string = LINK_KIND;

export const COMPONENT_CATALOG: readonly ComponentKindEntry[] = COMPONENT_KINDS.map(kind => ({
    kind,
    role: COMPONENT_REGISTRY[kind].role,
    interactive: COMPONENT_REGISTRY[kind].interactive,
    describe: COMPONENT_REGISTRY[kind].describe,
}));
