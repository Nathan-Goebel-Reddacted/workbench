import { describe, expect, it } from 'vitest';
import { Page } from '../domain/pageAggregate.js';
import { PageId } from '../domain/valueObject/pageId.js';
import { PageRef } from '../domain/valueObject/pageRef.js';
import { PageType } from '../domain/valueObject/pageType.js';
import { PageFactory } from '../domain/factory/pageFactory.js';
import { IPageRepository, PageVersionConflictError } from '../domain/repository/iPageRepository.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import type { IPageVisibility } from '../domain/port/iPageVisibility.js';
import type { IProjectDestinations, LinkDestination } from '../domain/port/iProjectDestinations.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { PageMutator } from './command/pageMutator.js';
import { EnsurePageHandler } from './command/ensurePage/ensurePageHandler.js';
import { EnsurePageCommand } from './command/ensurePage/ensurePageCommand.js';
import { AddElementHandler } from './command/addElement/addElementHandler.js';
import { AddElementCommand } from './command/addElement/addElementCommand.js';
import { MoveElementHandler } from './command/moveElement/moveElementHandler.js';
import { MoveElementCommand } from './command/moveElement/moveElementCommand.js';
import { ReorderElementHandler } from './command/reorderElement/reorderElementHandler.js';
import { ReorderElementCommand } from './command/reorderElement/reorderElementCommand.js';
import { DuplicateElementHandler } from './command/duplicateElement/duplicateElementHandler.js';
import { DuplicateElementCommand } from './command/duplicateElement/duplicateElementCommand.js';
import { SetComponentHandler } from './command/setComponent/setComponentHandler.js';
import { SetComponentCommand } from './command/setComponent/setComponentCommand.js';
import { RemoveComponentHandler } from './command/removeComponent/removeComponentHandler.js';
import { RemoveComponentCommand } from './command/removeComponent/removeComponentCommand.js';
import { DeleteElementHandler } from './command/deleteElement/deleteElementHandler.js';
import { DeleteElementCommand } from './command/deleteElement/deleteElementCommand.js';
import { ListPageRefsWithContentHandler } from './query/listPageRefsWithContent/listPageRefsWithContentHandler.js';
import { ListPageRefsWithContentQuery } from './query/listPageRefsWithContent/listPageRefsWithContentQuery.js';
import { GetPageByRefHandler } from './query/getPageByRef/getPageByRefHandler.js';
import { GetPageByRefQuery } from './query/getPageByRef/getPageByRefQuery.js';

const PAGE_REF = '22222222-2222-4222-8222-222222222222';
const ELEMENT = '33333333-3333-4333-8333-333333333333';

class InMemoryPageRepository implements IPageRepository {
    pages: Page[] = [];
    saves = 0;

    async findById(id: PageId): Promise<Page | null> {
        return this.pages.find(p => p.getId().equals(id)) ?? null;
    }

    async findByRef(pageType: PageType, pageRef: PageRef): Promise<Page | null> {
        return this.pages.find(p => p.getPageType() === pageType && p.getPageRef().equals(pageRef)) ?? null;
    }

    async findByRefs(pageType: PageType, pageRefs: readonly PageRef[]): Promise<Page[]> {
        return this.pages.filter(p => p.getPageType() === pageType && pageRefs.some(ref => ref.equals(p.getPageRef())));
    }

    async save(page: Page): Promise<void> {
        this.saves += 1;
        this.pages = [
            ...this.pages.filter(p => !p.getId().equals(page.getId())),
            new Page(page.getId(), page.getPageType(), page.getPageRef(), page.getElements(), page.getVersion() + 1),
        ];
    }
}

class SpyUploads implements IUploadStorage {
    readonly released: unknown[] = [];

    async release(): Promise<void> {}

    async releaseFromContent(content: unknown): Promise<void> {
        this.released.push(content);
    }
}

function destinations(known: Record<string, LinkDestination> = {}): IProjectDestinations & { asked: string[][] } {
    return {
        asked: [],
        async destinationsOf(projectIds) {
            this.asked.push([...projectIds]);
            return new Map(projectIds.flatMap(id => (known[id] ? [[id, known[id]] as const] : [])));
        },
    };
}

async function pageWithElement() {
    const repository = new InMemoryPageRepository();
    const uploads = new SpyUploads();
    const mutator = new PageMutator(repository, uploads);
    const pageId = crypto.randomUUID();
    await new EnsurePageHandler(repository, new PageFactory()).handle(
        new EnsurePageCommand(pageId, PageType.PORTFOLIO, PAGE_REF),
    );
    await new AddElementHandler(mutator).handle(new AddElementCommand(pageId, ELEMENT, null));
    const elements = async () => (await repository.findById(new PageId(pageId)))!.getElements();
    return { repository, uploads, mutator, pageId, elements };
}

describe('EnsurePageHandler', () => {
    it('crée la Page qui n’existe pas et garde celle qui existe', async () => {
        const repository = new InMemoryPageRepository();
        const handler = new EnsurePageHandler(repository, new PageFactory());

        await handler.handle(new EnsurePageCommand(crypto.randomUUID(), PageType.PORTFOLIO, PAGE_REF));
        await handler.handle(new EnsurePageCommand(crypto.randomUUID(), PageType.PORTFOLIO, PAGE_REF));

        expect(repository.pages).toHaveLength(1);
    });

    it('s’en tient à la Page créée en même temps par quelqu’un d’autre', async () => {
        const repository = new InMemoryPageRepository();
        repository.save = async () => {
            throw new PageVersionConflictError('x');
        };

        await expect(
            new EnsurePageHandler(repository, new PageFactory()).handle(
                new EnsurePageCommand(crypto.randomUUID(), PageType.PORTFOLIO, PAGE_REF),
            ),
        ).resolves.toBeUndefined();
    });
});

describe('commandes sur les Elements', () => {
    it('ajoute un Element vide avec l’id donné', async () => {
        const { elements } = await pageWithElement();

        const [element] = await elements();
        expect(element.getId().getValue()).toBe(ELEMENT);
        expect(element.getComponents()).toEqual({});
    });

    it('déplace un Element', async () => {
        const { mutator, pageId, elements } = await pageWithElement();

        await new MoveElementHandler(mutator).handle(new MoveElementCommand(pageId, ELEMENT, 8, 16, 24, 32));

        expect((await elements())[0].getTransform().getX()).toBe(8);
    });

    it('duplique un Element puis le recule sous sa copie', async () => {
        const { mutator, pageId, elements } = await pageWithElement();
        const copy = crypto.randomUUID();

        await new DuplicateElementHandler(mutator).handle(new DuplicateElementCommand(pageId, ELEMENT, copy));
        await new ReorderElementHandler(mutator).handle(new ReorderElementCommand(pageId, copy, 'backward'));

        expect((await elements()).map(e => e.getId().getValue())).toEqual([copy, ELEMENT]);
    });

    it('libère l’ancien contenu quand on le remplace, pas à la première pose', async () => {
        const { mutator, uploads, pageId } = await pageWithElement();
        const handler = new SetComponentHandler(mutator);

        await handler.handle(new SetComponentCommand(pageId, ELEMENT, 'text', { html: '<img src="/uploads/a.png">' }));
        expect(uploads.released).toEqual([]);

        await handler.handle(new SetComponentCommand(pageId, ELEMENT, 'text', { html: '<p>b</p>' }));
        expect(uploads.released).toEqual([[{ html: '<img src="/uploads/a.png">', scale: 'normal', color: null }]]);
    });

    it('libère le contenu retiré', async () => {
        const { mutator, uploads, pageId, elements } = await pageWithElement();
        await new SetComponentHandler(mutator).handle(
            new SetComponentCommand(pageId, ELEMENT, 'text', { html: '/uploads/a.png' }),
        );

        await new RemoveComponentHandler(mutator).handle(new RemoveComponentCommand(pageId, ELEMENT, 'text'));

        expect(uploads.released).toEqual([[{ html: '/uploads/a.png', scale: 'normal', color: null }]]);
        expect((await elements())[0].getComponents()).toEqual({});
    });

    it('libère les Components d’un Element supprimé', async () => {
        const { mutator, uploads, pageId, elements } = await pageWithElement();
        await new SetComponentHandler(mutator).handle(
            new SetComponentCommand(pageId, ELEMENT, 'text', { html: '/uploads/a.png' }),
        );

        await new DeleteElementHandler(mutator).handle(new DeleteElementCommand(pageId, ELEMENT));

        expect(uploads.released).toEqual([[{ text: { html: '/uploads/a.png', scale: 'normal', color: null } }]]);
        expect(await elements()).toEqual([]);
    });

    it('signale une Page inconnue', async () => {
        const { mutator } = await pageWithElement();

        await expect(
            new DeleteElementHandler(mutator).handle(new DeleteElementCommand(crypto.randomUUID(), ELEMENT)),
        ).rejects.toThrow(NotFoundError);
    });
});

describe('ListPageRefsWithContentHandler', () => {
    it('ne retient que les Pages dont un Element porte un contenu', async () => {
        const { repository, mutator, pageId } = await pageWithElement();
        const empty = '44444444-4444-4444-8444-444444444444';
        const missing = '55555555-5555-4555-8555-555555555555';
        await new EnsurePageHandler(repository, new PageFactory()).handle(
            new EnsurePageCommand(crypto.randomUUID(), PageType.PORTFOLIO, empty),
        );
        await new SetComponentHandler(mutator).handle(new SetComponentCommand(pageId, ELEMENT, 'text', {}));
        const handler = new ListPageRefsWithContentHandler(repository);

        const refs = await handler.handle(new ListPageRefsWithContentQuery('portfolio', [PAGE_REF, empty, missing]));

        expect(refs).toEqual([PAGE_REF]);
    });
});

describe('GetPageByRefHandler', () => {
    function visibility(isPublic: boolean): IPageVisibility & { asked: number } {
        return {
            asked: 0,
            async isPublic() {
                this.asked += 1;
                return isPublic;
            },
        };
    }

    async function repositoryWithPage() {
        const repository = new InMemoryPageRepository();
        await new EnsurePageHandler(repository, new PageFactory()).handle(
            new EnsurePageCommand(crypto.randomUUID(), PageType.PROJECT, PAGE_REF),
        );
        return repository;
    }

    it('rend la Page publique avec sa largeur de référence', async () => {
        const handler = new GetPageByRefHandler(await repositoryWithPage(), visibility(true), destinations());

        const dto = await handler.handle(new GetPageByRefQuery('project', PAGE_REF));

        expect(dto).toMatchObject({ pageRef: PAGE_REF, referenceWidth: 1440, hasContent: false, elements: [] });
    });

    it('dit qu’une Page a du contenu dès qu’un Element en porte un, comme la destination des projets', async () => {
        const { repository, mutator, pageId } = await pageWithElement();
        const handler = new GetPageByRefHandler(repository, visibility(true), destinations());
        const read = () => handler.handle(new GetPageByRefQuery('portfolio', PAGE_REF));

        expect((await read())?.hasContent).toBe(false);

        await new SetComponentHandler(mutator).handle(new SetComponentCommand(pageId, ELEMENT, 'text', {}));

        expect((await read())?.hasContent).toBe(true);
    });

    it('tait une Page masquée', async () => {
        const handler = new GetPageByRefHandler(await repositoryWithPage(), visibility(false), destinations());

        expect(await handler.handle(new GetPageByRefQuery('project', PAGE_REF))).toBeNull();
    });

    it('rend une Page masquée à la lecture privée', async () => {
        const hidden = visibility(false);
        const handler = new GetPageByRefHandler(await repositoryWithPage(), hidden, destinations());

        const dto = await handler.handle(new GetPageByRefQuery('project', PAGE_REF, true));

        expect(dto?.pageRef).toBe(PAGE_REF);
        expect(hidden.asked).toBe(0);
    });

    it('refuse un type de Page inconnu', async () => {
        const handler = new GetPageByRefHandler(await repositoryWithPage(), visibility(true), destinations());

        await expect(handler.handle(new GetPageByRefQuery('galerie', PAGE_REF))).rejects.toThrow();
    });
});

describe('destination des Links vers un projet', () => {
    const PROJECT = '66666666-6666-4666-8666-666666666666';
    const UNKNOWN = '77777777-7777-4777-8777-777777777777';

    async function readWithLink(link: Record<string, unknown>, known: Record<string, LinkDestination>) {
        const { repository, mutator, pageId } = await pageWithElement();
        await new SetComponentHandler(mutator).handle(new SetComponentCommand(pageId, ELEMENT, 'link', link));
        const port = destinations(known);
        const dto = await new GetPageByRefHandler(repository, { isPublic: async () => true }, port).handle(
            new GetPageByRefQuery('portfolio', PAGE_REF),
        );
        return { link: dto?.elements[0].components.link, port };
    }

    it('joint la destination du projet visé', async () => {
        const { link, port } = await readWithLink(
            { projectId: PROJECT },
            { [PROJECT]: { kind: 'external', url: 'https://example.com/' } },
        );

        expect(link).toMatchObject({
            projectId: PROJECT,
            destination: { kind: 'external', url: 'https://example.com/' },
        });
        expect(port.asked).toEqual([[PROJECT]]);
    });

    it('rend inactif un Link vers un projet dont la destination est inconnue', async () => {
        const { link } = await readWithLink({ projectId: UNKNOWN }, {});

        expect(link).toMatchObject({ destination: { kind: 'none' } });
    });

    it('ne résout rien pour un Link vers une URL', async () => {
        const { link } = await readWithLink({ url: 'https://example.com' }, {});

        expect(link).toMatchObject({ url: 'https://example.com/', destination: null });
    });
});
