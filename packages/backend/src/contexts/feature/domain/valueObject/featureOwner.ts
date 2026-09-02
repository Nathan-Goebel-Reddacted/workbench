import { InvalidFeatureOwnerException } from '../exception/invalidFeatureOwner';

/**
 * Ce qui porte une feature. Une union fermée, jamais une chaîne libre : le jour où l'on ajoute un
 * troisième porteur, le compilateur désigne tous les endroits à traiter.
 */
export type OwnerType = 'project' | 'idea';

const OWNER_TYPES: readonly OwnerType[] = ['project', 'idea'];

export function isOwnerType(value: string): value is OwnerType {
    return (OWNER_TYPES as readonly string[]).includes(value);
}

export class FeatureOwner {
    private readonly type: OwnerType;
    private readonly id: string;

    constructor(type: string, id: string) {
        if (!isOwnerType(type) || !id || !id.trim()) {
            throw new InvalidFeatureOwnerException();
        }
        this.type = type;
        this.id = id;
    }

    static project(id: string): FeatureOwner {
        return new FeatureOwner('project', id);
    }

    static idea(id: string): FeatureOwner {
        return new FeatureOwner('idea', id);
    }

    getType(): OwnerType {
        return this.type;
    }

    getId(): string {
        return this.id;
    }

    /** Un porteur « idée » signifie un travail pas encore démarré — voir la règle de statut du Ticket. */
    isIdea(): boolean {
        return this.type === 'idea';
    }

    equals(other: FeatureOwner): boolean {
        return this.type === other.type && this.id === other.id;
    }
}
