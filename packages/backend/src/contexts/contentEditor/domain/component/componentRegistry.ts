import { ComponentReader } from './componentReader';
import { InvalidComponentException } from '../exception/invalidComponent';
import { UnknownComponentKindException } from '../exception/unknownComponentKind';

export type ComponentValue = Readonly<Record<string, unknown>>;

export type ComponentDescriptor = Readonly<{
    role: 'content' | 'facet';
    interactive: boolean;
    flow: 'text' | 'visual';
    normalize: (component: ComponentReader) => ComponentValue;
    describe: string;
}>;

export const TEXT_SCALES = ['normal', 'large', 'display'] as const;

export const COMPONENT_REGISTRY = {
    text: {
        role: 'content',
        interactive: false,
        flow: 'text',
        normalize: component => ({
            html: component.string('html'),
            scale: component.oneOf('scale', TEXT_SCALES, 'normal'),
        }),
        describe: `Rich text. { html: string (TipTap HTML), scale: ${TEXT_SCALES.join(' | ')} }`,
    },
} as const satisfies Record<string, ComponentDescriptor>;

export type ComponentKind = keyof typeof COMPONENT_REGISTRY;

export const COMPONENT_KINDS = Object.keys(COMPONENT_REGISTRY) as ComponentKind[];

export function isComponentKind(kind: string): kind is ComponentKind {
    return Object.hasOwn(COMPONENT_REGISTRY, kind);
}

export function parseComponentKind(kind: string): ComponentKind {
    if (!isComponentKind(kind)) throw new UnknownComponentKindException(kind, COMPONENT_KINDS);
    return kind;
}

export function normalizeComponent(kind: ComponentKind, raw: unknown, strict: boolean): ComponentValue | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        if (strict) throw new InvalidComponentException(kind, 'an object');
        return null;
    }
    return COMPONENT_REGISTRY[kind].normalize(new ComponentReader(raw as Record<string, unknown>, strict, kind));
}

export function contentConflict<K extends string>(
    present: readonly K[],
    incoming: K,
    registry: Readonly<Record<K, ComponentDescriptor>>,
): K | null {
    if (registry[incoming].role !== 'content') return null;
    return present.find(kind => kind !== incoming && registry[kind].role === 'content') ?? null;
}
