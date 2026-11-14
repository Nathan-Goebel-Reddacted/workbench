import { describe, expect, it } from 'vitest';
import { PageMutator } from './pageMutator.js';
import { Page } from '../../domain/pageAggregate.js';
import { PageId } from '../../domain/valueObject/pageId.js';
import { PageRef } from '../../domain/valueObject/pageRef.js';
import { PageType } from '../../domain/valueObject/pageType.js';
import { ElementId } from '../../domain/valueObject/elementId.js';
import { Transform } from '../../domain/valueObject/transform.js';
import { Element } from '../../domain/entity/element.js';
import { IPageRepository, PageVersionConflictError } from '../../domain/repository/iPageRepository.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';

// La Page est enregistrée d'un bloc. Une commande partie d'une version que quelqu'un d'autre a
// changée entre-temps est rejouée sur la Page relue : la modification de l'autre n'est pas perdue.

const PAGE_ID = new PageId();

type Stored = {
    elements: Array<{ id: string; transform: Transform; components: Record<string, unknown> }>;
    version: number;
};

class FakeRepository implements IPageRepository {
    readonly events: string[] = [];
    concurrentWrites: Array<(stored: Stored) => void> = [];

    constructor(public stored: Stored) {}

    async findById(): Promise<Page | null> {
        this.events.push(`read v${this.stored.version}`);
        const elements = this.stored.elements.map(e =>
            Element.rehydrate(new ElementId(e.id), e.transform, e.components),
        );
        return new Page(PAGE_ID, PageType.PORTFOLIO, new PageRef(), elements, this.stored.version);
    }

    async findByRef(): Promise<Page | null> {
        return null;
    }

    async findByRefs(): Promise<Page[]> {
        return [];
    }

    async save(page: Page): Promise<void> {
        const concurrent = this.concurrentWrites.shift();
        if (concurrent) {
            concurrent(this.stored);
            this.stored.version += 1;
        }
        if (page.getVersion() !== this.stored.version) {
            this.events.push(`conflict v${page.getVersion()}`);
            throw new PageVersionConflictError(page.getId().getValue());
        }
        this.events.push(`save v${page.getVersion()}`);
        this.stored = {
            version: this.stored.version + 1,
            elements: page.getElements().map(e => ({
                id: e.getId().getValue(),
                transform: e.getTransform(),
                components: e.getComponents(),
            })),
        };
    }
}

class FakeUploads implements IUploadStorage {
    constructor(private readonly events: string[]) {}

    async release(): Promise<void> {}

    async releaseFromContent(content: unknown): Promise<void> {
        this.events.push(`release ${JSON.stringify(content)}`);
    }
}

const FIRST = '11111111-1111-4111-8111-111111111111';
const SECOND = '22222222-2222-4222-8222-222222222222';

function setup() {
    const repository = new FakeRepository({
        version: 1,
        elements: [
            { id: FIRST, transform: new Transform(0, 0, 10, 10), components: { text: { html: '/uploads/a.png' } } },
            { id: SECOND, transform: new Transform(0, 0, 10, 10), components: {} },
        ],
    });
    const mutator = new PageMutator(repository, new FakeUploads(repository.events));
    return { repository, mutator };
}

describe('PageMutator', () => {
    it('rejoue la commande sur la Page relue quand une autre écriture est passée entre-temps', async () => {
        const { repository, mutator } = setup();
        repository.concurrentWrites.push(stored => {
            stored.elements[1].transform = new Transform(100, 100, 10, 10);
        });

        await mutator.apply(PAGE_ID.getValue(), page => {
            page.moveElement(new ElementId(FIRST), new Transform(50, 50, 10, 10));
            return [];
        });

        expect(repository.events).toEqual(['read v1', 'conflict v1', 'read v2', 'save v2']);
        expect(repository.stored.elements[0].transform.getX()).toBe(50);
        expect(repository.stored.elements[1].transform.getX()).toBe(100);
    });

    it('libère les fichiers de l’ancien contenu après l’enregistrement, une seule fois', async () => {
        const { repository, mutator } = setup();
        repository.concurrentWrites.push(() => {});

        await mutator.apply(PAGE_ID.getValue(), page => [page.removeElement(new ElementId(FIRST)).getComponents()]);

        expect(repository.events).toEqual([
            'read v1',
            'conflict v1',
            'read v2',
            'save v2',
            'release [{"text":{"html":"/uploads/a.png","scale":"normal"}}]',
        ]);
    });

    it('abandonne après plusieurs conflits d’affilée', async () => {
        const { repository, mutator } = setup();
        repository.concurrentWrites.push(
            () => {},
            () => {},
            () => {},
        );

        await expect(mutator.apply(PAGE_ID.getValue(), () => [])).rejects.toThrow(PageVersionConflictError);
        expect(repository.events.filter(e => e.startsWith('release'))).toEqual([]);
    });

    it('signale une Page inconnue', async () => {
        const missing = new PageMutator(
            {
                findById: async () => null,
                findByRef: async () => null,
                findByRefs: async () => [],
                save: async () => {},
            },
            new FakeUploads([]),
        );

        await expect(missing.apply(PAGE_ID.getValue(), () => [])).rejects.toThrow(NotFoundError);
    });
});
