import { beforeEach, describe, expect, it } from 'vitest';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import type { ILogger } from '@shared/application/port/iLogger.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery.js';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery.js';
import { Page } from '@contexts/contentEditor/domain/pageAggregate.js';
import type { IPageRepository } from '@contexts/contentEditor/domain/repository/iPageRepository.js';
import { PageFactory } from '@contexts/contentEditor/domain/factory/pageFactory.js';
import { SiteOrigins } from '@contexts/contentEditor/domain/valueObject/siteOrigins.js';
import { COMPONENT_KINDS } from '@contexts/contentEditor/domain/component/componentRegistry.js';
import { PageMutator } from '@contexts/contentEditor/application/command/pageMutator.js';
import { EnsurePageCommand } from '@contexts/contentEditor/application/command/ensurePage/ensurePageCommand.js';
import { EnsurePageHandler } from '@contexts/contentEditor/application/command/ensurePage/ensurePageHandler.js';
import { AddElementCommand } from '@contexts/contentEditor/application/command/addElement/addElementCommand.js';
import { AddElementHandler } from '@contexts/contentEditor/application/command/addElement/addElementHandler.js';
import { MoveElementCommand } from '@contexts/contentEditor/application/command/moveElement/moveElementCommand.js';
import { MoveElementHandler } from '@contexts/contentEditor/application/command/moveElement/moveElementHandler.js';
import { HideElementCommand } from '@contexts/contentEditor/application/command/hideElement/hideElementCommand.js';
import { HideElementHandler } from '@contexts/contentEditor/application/command/hideElement/hideElementHandler.js';
import { RegenerateLayoutCommand } from '@contexts/contentEditor/application/command/regenerateLayout/regenerateLayoutCommand.js';
import { RegenerateLayoutHandler } from '@contexts/contentEditor/application/command/regenerateLayout/regenerateLayoutHandler.js';
import { ReorderElementCommand } from '@contexts/contentEditor/application/command/reorderElement/reorderElementCommand.js';
import { ReorderElementHandler } from '@contexts/contentEditor/application/command/reorderElement/reorderElementHandler.js';
import { DuplicateElementCommand } from '@contexts/contentEditor/application/command/duplicateElement/duplicateElementCommand.js';
import { DuplicateElementHandler } from '@contexts/contentEditor/application/command/duplicateElement/duplicateElementHandler.js';
import { SetComponentCommand } from '@contexts/contentEditor/application/command/setComponent/setComponentCommand.js';
import { SetComponentHandler } from '@contexts/contentEditor/application/command/setComponent/setComponentHandler.js';
import { RemoveComponentCommand } from '@contexts/contentEditor/application/command/removeComponent/removeComponentCommand.js';
import { RemoveComponentHandler } from '@contexts/contentEditor/application/command/removeComponent/removeComponentHandler.js';
import { DeleteElementCommand } from '@contexts/contentEditor/application/command/deleteElement/deleteElementCommand.js';
import { DeleteElementHandler } from '@contexts/contentEditor/application/command/deleteElement/deleteElementHandler.js';
import { GetPageByRefQuery } from '@contexts/contentEditor/application/query/getPageByRef/getPageByRefQuery.js';
import { GetPageByRefHandler } from '@contexts/contentEditor/application/query/getPageByRef/getPageByRefHandler.js';
import type { ElementDto, PageDto } from '@contexts/contentEditor/application/query/pageDto.js';
import { ToolRegistry } from '../toolRegistry.js';
import { toolInputJsonSchema } from '../toolDescriptor.js';
import { AgentTool } from '../../../domain/agentToolAggregate.js';
import { AgentToolId } from '../../../domain/valueObject/agentToolId.js';
import { UserId } from '../../../domain/valueObject/userId.js';
import { Name } from '../../../domain/valueObject/name.js';
import { Permission, PermissionValue } from '../../../domain/valueObject/permission.js';
import { Scope, ScopeValue } from '../../../domain/valueObject/scope.js';
import { Token } from '../../../domain/valueObject/token.js';
import { createPageTools } from './pageTools.js';

const PORTFOLIO_ID = '11111111-1111-4111-8111-111111111111';
const UNKNOWN_PORTFOLIO_ID = '99999999-9999-4999-8999-999999999999';
const PROJECT_ID = '22222222-2222-4222-8222-222222222222';
const UNKNOWN_PROJECT_ID = '88888888-8888-4888-8888-888888888888';
const HOME = { type: 'portfolio', portfolioId: PORTFOLIO_ID };
const PROJECT = { type: 'project', projectId: PROJECT_ID };

const silentLogger: ILogger = { info: () => {}, warn: () => {}, error: () => {} };
const context = { agentToolId: 'a1', userId: 'u1' };
const writer = new AgentTool(
    new AgentToolId(),
    new UserId('u1'),
    new Name('agent'),
    new Permission(PermissionValue.READ_WRITE),
    [new Scope(ScopeValue.PORTFOLIO)],
    new Token('hash'),
);

function inMemoryPages(): IPageRepository {
    let pages: Page[] = [];
    return {
        findById: async id => pages.find(p => p.getId().equals(id)) ?? null,
        findByRef: async (pageType, pageRef) =>
            pages.find(p => p.getPageType() === pageType && p.getPageRef().equals(pageRef)) ?? null,
        findByRefs: async (pageType, pageRefs) =>
            pages.filter(p => p.getPageType() === pageType && pageRefs.some(ref => ref.equals(p.getPageRef()))),
        save: async page => {
            pages = [
                ...pages.filter(p => !p.getId().equals(page.getId())),
                new Page(
                    page.getId(),
                    page.getPageType(),
                    page.getPageRef(),
                    page.getElements(),
                    page.getVersion() + 1,
                ),
            ];
        },
    };
}

function setup() {
    const pages = inMemoryPages();
    const uploads = { release: async () => {}, releaseFromContent: async () => {} } as unknown as IUploadStorage;
    const mutator = new PageMutator(pages, uploads);
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();

    commandBus.register(EnsurePageCommand.commandName, new EnsurePageHandler(pages, new PageFactory()));
    commandBus.register(AddElementCommand.commandName, new AddElementHandler(mutator));
    commandBus.register(MoveElementCommand.commandName, new MoveElementHandler(mutator));
    commandBus.register(HideElementCommand.commandName, new HideElementHandler(mutator));
    commandBus.register(RegenerateLayoutCommand.commandName, new RegenerateLayoutHandler(mutator));
    commandBus.register(ReorderElementCommand.commandName, new ReorderElementHandler(mutator));
    commandBus.register(DuplicateElementCommand.commandName, new DuplicateElementHandler(mutator));
    commandBus.register(SetComponentCommand.commandName, new SetComponentHandler(mutator, SiteOrigins.none()));
    commandBus.register(RemoveComponentCommand.commandName, new RemoveComponentHandler(mutator));
    commandBus.register(DeleteElementCommand.commandName, new DeleteElementHandler(mutator));
    queryBus.register(
        GetPageByRefQuery.queryName,
        new GetPageByRefHandler(
            pages,
            { isPublic: async () => false },
            {
                projects: { summariesOf: async () => new Map() },
                presence: { missing: async () => new Set<string>() },
                bindings: { missing: async () => new Set<string>() },
            },
        ),
    );
    queryBus.register(GetPortfolioByIdQuery.queryName, {
        handle: async (query: GetPortfolioByIdQuery) =>
            query.id === PORTFOLIO_ID ? { id: PORTFOLIO_ID, languages: [] } : null,
    });
    queryBus.register(GetProjectByIdQuery.queryName, {
        handle: async (query: GetProjectByIdQuery) =>
            query.id === PROJECT_ID && query.includeHidden ? { id: PROJECT_ID } : null,
    });

    const registry = new ToolRegistry(silentLogger);
    const tools = createPageTools(commandBus, queryBus);
    registry.register(...tools);
    return {
        tools,
        call: (name: string, args: Record<string, unknown>) => registry.execute(name, args, writer, context),
    };
}

describe('Outils MCP des Pages', () => {
    let call: ReturnType<typeof setup>['call'];

    beforeEach(() => {
        call = setup().call;
    });

    async function ok<T>(name: string, args: Record<string, unknown>): Promise<T> {
        const result = await call(name, args);
        if (!result.ok) throw new Error(result.error.message);
        return result.data as T;
    }

    const addElement = (transform?: Record<string, number>) => ok<ElementDto>('add_element', { page: HOME, transform });

    it('ajoute un Element à l’emplacement demandé et le rend tel que persisté', async () => {
        const element = await addElement({ x: 0, y: 0, w: 480, h: 160 });

        expect(element).toMatchObject({
            layout: { desktop: { transform: { x: 0, y: 0, w: 480, h: 160 }, hidden: false } },
            components: {},
            issues: [],
        });
        expect(element.layout.mobile.transform).toMatchObject({ x: 16, w: 343 });
    });

    it('place un Element sans transform sous le plus bas', async () => {
        await addElement({ x: 0, y: 0, w: 480, h: 160 });

        const element = await addElement();

        expect(element.layout.desktop.transform.y).toBeGreaterThan(160);
    });

    it('refuse un transform qui dépasse la largeur de référence avant toute écriture', async () => {
        const result = await call('add_element', { page: HOME, transform: { x: 1000, y: 0, w: 480, h: 160 } });
        const page = await call('get_page', { page: HOME });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('invalid_input');
        expect(!page.ok && page.error.code).toBe('not_found');
    });

    it('pose un Component et montre ce qui a été gardé : défauts posés, champs inconnus retirés', async () => {
        const element = await addElement();

        const saved = await ok<ElementDto>('set_component', {
            page: HOME,
            elementId: element.id,
            kind: 'text',
            value: { html: '<h1>Nathan</h1>', unknown: 1 },
        });

        expect(saved.components).toEqual({
            text: {
                html: '<h1>Nathan</h1>',
                font: 'body',
                fontSize: { desktop: 16, tablet: 15, mobile: 14 },
                uppercase: false,
                letterSpacing: 0,
                color: null,
            },
        });
    });

    it('refuse une valeur invalide en nommant le champ', async () => {
        const element = await addElement();

        const result = await call('set_component', {
            page: HOME,
            elementId: element.id,
            kind: 'text',
            value: { html: '<p>ok</p>', font: 'huge' },
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).toMatch(/font/);
    });

    it('refuse un Link sur un contenu interactif avec le message du domaine', async () => {
        const element = await addElement();
        await ok('set_component', { page: HOME, elementId: element.id, kind: 'contactForm', value: {} });

        const result = await call('set_component', {
            page: HOME,
            elementId: element.id,
            kind: 'link',
            value: { url: 'https://example.com' },
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).toMatch(/contactForm/);
    });

    it('refuse le transform comme Component', async () => {
        const element = await addElement();

        const result = await call('set_component', {
            page: HOME,
            elementId: element.id,
            kind: 'transform',
            value: { x: 0, y: 0, w: 8, h: 8 },
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('invalid_input');
    });

    it('retire un Component', async () => {
        const element = await addElement();
        await ok('set_component', { page: HOME, elementId: element.id, kind: 'surface', value: { radius: 8 } });

        const saved = await ok<ElementDto>('remove_component', { page: HOME, elementId: element.id, kind: 'surface' });

        expect(saved.components).toEqual({});
    });

    it('déplace et redimensionne un Element', async () => {
        const element = await addElement();

        const saved = await ok<ElementDto>('move_element', {
            page: HOME,
            elementId: element.id,
            transform: { x: 8, y: 16, w: 320, h: 64 },
        });

        expect(saved.layout.desktop.transform).toEqual({ x: 8, y: 16, w: 320, h: 64 });
    });

    it('place un Element sur mobile sans toucher le desktop, et borne le transform par la taille', async () => {
        const element = await addElement({ x: 0, y: 0, w: 480, h: 160 });

        const saved = await ok<ElementDto>('move_element', {
            page: HOME,
            elementId: element.id,
            screen: 'mobile',
            transform: { x: 16, y: 40, w: 343, h: 120 },
        });
        const tooWide = await call('move_element', {
            page: HOME,
            elementId: element.id,
            screen: 'mobile',
            transform: { x: 0, y: 0, w: 480, h: 160 },
        });

        expect(saved.layout.mobile.transform).toEqual({ x: 16, y: 40, w: 343, h: 120 });
        expect(saved.layout.desktop.transform).toEqual({ x: 0, y: 0, w: 480, h: 160 });
        expect(tooWide.ok).toBe(false);
        if (!tooWide.ok) expect(tooWide.error.code).toBe('invalid_input');
    });

    it('masque un Element sur une taille, puis régénère la tablette depuis le desktop', async () => {
        const first = await addElement({ x: 0, y: 0, w: 480, h: 160 });
        await addElement({ x: 800, y: 0, w: 480, h: 160 });

        const hidden = await ok<ElementDto>('hide_element', { page: HOME, elementId: first.id, screen: 'mobile' });
        const page = await ok<PageDto>('regenerate_layout', { page: HOME, screen: 'tablet' });

        expect(hidden.layout.mobile.hidden).toBe(true);
        expect(hidden.layout.desktop.hidden).toBe(false);
        const [a, b] = page.elements.map(e => e.layout.tablet.transform);
        expect(a.y).toBeLessThan(b.y);
        expect([a.x, a.w, b.x, b.w]).toEqual([16, 736, 16, 736]);
    });

    it('duplique un Element avec ses Components, puis le recule sous l’original', async () => {
        const element = await addElement();
        await ok('set_component', { page: HOME, elementId: element.id, kind: 'code', value: { code: 'x' } });

        const copy = await ok<ElementDto>('duplicate_element', { page: HOME, elementId: element.id });
        const page = await ok<PageDto>('reorder_element', { page: HOME, elementId: copy.id, direction: 'backward' });

        expect(copy.id).not.toBe(element.id);
        expect(copy.components).toEqual({ code: { code: 'x', language: '', wrap: false } });
        expect(page.elements.map(e => e.id)).toEqual([copy.id, element.id]);
    });

    it('supprime un Element et rend la Page', async () => {
        const element = await addElement();

        const page = await ok<PageDto>('remove_element', { page: HOME, elementId: element.id });

        expect(page.elements).toEqual([]);
    });

    it('signale un Element inconnu au lieu de prétendre l’avoir modifié', async () => {
        await addElement();

        const result = await call('move_element', {
            page: HOME,
            elementId: UNKNOWN_PORTFOLIO_ID,
            transform: { x: 0, y: 0, w: 8, h: 8 },
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).toMatch(/Element not found/);
    });

    it('lit la Page, même masquée, avec ses Elements dans l’ordre d’affichage', async () => {
        const first = await addElement();
        const second = await addElement();

        const page = await ok<PageDto>('get_page', { page: HOME });

        expect(page).toMatchObject({
            pageType: 'portfolio',
            pageRef: PORTFOLIO_ID,
            screens: { desktop: { width: 1440 } },
        });
        expect(page.elements.map(e => e.id)).toEqual([first.id, second.id]);
    });

    it('travaille sur la Page d’un projet sans toucher l’accueil', async () => {
        await ok('add_element', { page: PROJECT });
        const project = await ok<PageDto>('get_page', { page: PROJECT });
        const home = await call('get_page', { page: HOME });

        expect(project).toMatchObject({ pageType: 'project', pageRef: PROJECT_ID });
        expect(project.elements).toHaveLength(1);
        expect(!home.ok && home.error.code).toBe('not_found');
    });

    it.each([
        { type: 'portfolio', portfolioId: UNKNOWN_PORTFOLIO_ID },
        { type: 'project', projectId: UNKNOWN_PROJECT_ID },
    ])('ne crée aucune Page pour un propriétaire inexistant (%o)', async page => {
        const added = await call('add_element', { page });
        const read = await call('get_page', { page });

        expect(!added.ok && added.error.code).toBe('not_found');
        expect(!read.ok && read.error.code).toBe('not_found');
    });

    it('refuse une page dont le type est inconnu', async () => {
        const result = await call('get_page', { page: { type: 'cv', portfolioId: PORTFOLIO_ID } });

        expect(result.ok).toBe(false);
    });
});

describe('Catalogue des outils de Page', () => {
    const { tools } = setup();
    const named = (name: string) => tools.find(tool => tool.name === name)!;

    it('expose les outils autour des Elements et des Components', () => {
        expect(tools.map(tool => tool.name)).toEqual([
            'get_page',
            'add_element',
            'move_element',
            'hide_element',
            'regenerate_layout',
            'set_component',
            'remove_component',
            'reorder_element',
            'duplicate_element',
            'remove_element',
        ]);
    });

    it('tire les kinds de set_component du registre, sans transform', () => {
        const schema = toolInputJsonSchema(named('set_component')) as {
            properties: { kind: { enum: string[] } };
        };

        expect(schema.properties.kind.enum).toEqual(COMPONENT_KINDS);
        expect(schema.properties.kind.enum).not.toContain('transform');
    });

    it('décrit chaque kind depuis le registre, la largeur de référence et la règle du Link', () => {
        const description = named('set_component').description;

        for (const kind of COMPONENT_KINDS) expect(description).toContain(`${kind} (`);
        expect(description).toMatch(/link component is refused on an interactive content \(.*contactForm/);
        expect(named('move_element').description).toContain('1440');
        expect(named('move_element').description).toContain('375');
    });
});
