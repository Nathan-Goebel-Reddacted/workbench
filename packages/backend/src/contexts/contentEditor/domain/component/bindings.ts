export const BINDING_ENTITIES = ['project', 'feature', 'ticket'] as const;

export type BindingEntity = (typeof BINDING_ENTITIES)[number];

export type BindingRef = Readonly<{ entity: BindingEntity; id: string }>;

const TAG = /<[a-z](?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const BINDING_ATTRIBUTE = /\sdata-binding(?:[\s=>/]|$)/i;

function attribute(tag: string, name: string): string | null {
    const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
    return match ? (match[1] ?? match[2]) : null;
}

function isBindingEntity(value: string | null): value is BindingEntity {
    return (BINDING_ENTITIES as readonly (string | null)[]).includes(value);
}

export function bindingsIn(html: string): BindingRef[] {
    return (html.match(TAG) ?? []).flatMap(tag => {
        if (!BINDING_ATTRIBUTE.test(tag)) return [];
        const entity = attribute(tag, 'data-entity');
        const id = attribute(tag, 'data-id');
        return isBindingEntity(entity) && id ? [{ entity, id }] : [];
    });
}

export function bindingKey(ref: BindingRef): string {
    return `${ref.entity}:${ref.id}`;
}
