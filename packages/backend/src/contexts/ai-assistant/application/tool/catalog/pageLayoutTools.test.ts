import { beforeEach, describe, expect, it } from 'vitest';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import type { ILogger } from '@shared/application/port/iLogger.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery.js';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery.js';
import { GetPageLayoutByRefQuery } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery.js';
import { GetPageLayoutByRefHandler } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefHandler.js';
import { EnsurePageLayoutCommand } from '@contexts/contentEditor/application/command/ensurePageLayout/ensurePageLayoutCommand.js';
import { EnsurePageLayoutHandler } from '@contexts/contentEditor/application/command/ensurePageLayout/ensurePageLayoutHandler.js';
import { AddSectionCommand } from '@contexts/contentEditor/application/command/addSection/addSectionCommand.js';
import { AddSectionHandler } from '@contexts/contentEditor/application/command/addSection/addSectionHandler.js';
import { MoveSectionCommand } from '@contexts/contentEditor/application/command/moveSection/moveSectionCommand.js';
import { MoveSectionHandler } from '@contexts/contentEditor/application/command/moveSection/moveSectionHandler.js';
import { UpdateSectionContentCommand } from '@contexts/contentEditor/application/command/updateSectionContent/updateSectionContentCommand.js';
import { UpdateSectionContentHandler } from '@contexts/contentEditor/application/command/updateSectionContent/updateSectionContentHandler.js';
import { RemoveSectionCommand } from '@contexts/contentEditor/application/command/removeSection/removeSectionCommand.js';
import { RemoveSectionHandler } from '@contexts/contentEditor/application/command/removeSection/removeSectionHandler.js';
import { PageLayoutFactory } from '@contexts/contentEditor/domain/factory/pageLayoutFactory.js';
import type { PageLayout } from '@contexts/contentEditor/domain/pageLayoutAggregate.js';
import type { IPageLayoutRepository } from '@contexts/contentEditor/domain/repository/iPageLayoutRepository.js';
import { ToolRegistry } from '../toolRegistry.js';
import { AgentTool } from '../../../domain/agentToolAggregate.js';
import { AgentToolId } from '../../../domain/valueObject/agentToolId.js';
import { UserId } from '../../../domain/valueObject/userId.js';
import { Name } from '../../../domain/valueObject/name.js';
import { Permission, PermissionValue } from '../../../domain/valueObject/permission.js';
import { Scope, ScopeValue } from '../../../domain/valueObject/scope.js';
import { Token } from '../../../domain/valueObject/token.js';
import { createPageLayoutTools } from './pageLayoutTools.js';

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

function inMemoryLayouts(): IPageLayoutRepository {
    const layouts: PageLayout[] = [];
    return {
        findById: async id => layouts.find(l => l.getId().equals(id)) ?? null,
        findByRef: async (pageType, pageRef) =>
            layouts.find(l => l.getPageType() === pageType && l.getPageRef().equals(pageRef)) ?? null,
        save: async layout => {
            if (!layouts.includes(layout)) layouts.push(layout);
        },
    };
}

function setup() {
    const layouts = inMemoryLayouts();
    const uploads = { release: async () => {}, releaseFromContent: async () => {} } as unknown as IUploadStorage;
    const commandBus = new CommandBus();
    const queryBus = new QueryBus();

    commandBus.register(
        EnsurePageLayoutCommand.commandName,
        new EnsurePageLayoutHandler(layouts, new PageLayoutFactory()),
    );
    commandBus.register(AddSectionCommand.commandName, new AddSectionHandler(layouts));
    commandBus.register(MoveSectionCommand.commandName, new MoveSectionHandler(layouts));
    commandBus.register(UpdateSectionContentCommand.commandName, new UpdateSectionContentHandler(layouts));
    commandBus.register(RemoveSectionCommand.commandName, new RemoveSectionHandler(layouts, uploads));
    queryBus.register(
        GetPageLayoutByRefQuery.queryName,
        new GetPageLayoutByRefHandler(layouts, { isPublic: async () => false }),
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
    registry.register(...createPageLayoutTools(commandBus, queryBus));
    return (name: string, args: Record<string, unknown>) => registry.execute(name, args, writer, context);
}

type Section = {
    id: string;
    type: string;
    content: Record<string, unknown>;
    x: number;
    y: number;
    w: number;
    h: number;
};

describe('Outils MCP du layout des pages', () => {
    let call: ReturnType<typeof setup>;

    beforeEach(() => {
        call = setup();
    });

    async function addText(placement?: Record<string, number>): Promise<Section> {
        const result = await call('add_section', {
            page: HOME,
            type: 'text',
            content: { html: '<h1>Nathan</h1>', scale: 'display' },
            placement,
        });
        if (!result.ok) throw new Error(result.error.message);
        return result.data as Section;
    }

    it('ajoute une section et la rend telle que persistée', async () => {
        const section = await addText({ x: 0, y: 0, w: 8, h: 2 });

        expect(section).toMatchObject({
            type: 'text',
            content: { html: '<h1>Nathan</h1>', scale: 'display' },
            x: 0,
            y: 0,
            w: 8,
            h: 2,
        });
    });

    it('lit le layout de la page portfolio, même masquée', async () => {
        const section = await addText();

        const result = await call('get_page_layout', { page: HOME });

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.data).toMatchObject({ pageType: 'portfolio', pageRef: PORTFOLIO_ID, gridColumns: 12 });
        expect((result.data as { sections: Section[] }).sections.map(s => s.id)).toEqual([section.id]);
        expect((result.data as { allowedSectionTypes: string[] }).allowedSectionTypes).not.toContain('projectCard');
    });

    it('montre le content réellement gardé : défauts posés, champs inconnus retirés', async () => {
        const section = await addText();

        const result = await call('update_section_content', {
            page: HOME,
            sectionId: section.id,
            content: { html: '<p>ok</p>', unknown: 1 },
        });

        expect(result.ok && (result.data as Section).content).toEqual({ html: '<p>ok</p>', scale: 'normal' });
    });

    it('refuse une valeur invalide en nommant le champ', async () => {
        const section = await addText();

        const result = await call('update_section_content', {
            page: HOME,
            sectionId: section.id,
            content: { html: '<p>ok</p>', scale: 'huge' },
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).toMatch(/scale/);
    });

    it('déplace une section', async () => {
        const section = await addText();

        const result = await call('move_section', {
            page: HOME,
            sectionId: section.id,
            x: 4,
            y: 3,
            w: 8,
            h: 1,
        });

        expect(result.ok && result.data).toMatchObject({ x: 4, y: 3, w: 8, h: 1 });
    });

    it('retire une section', async () => {
        const section = await addText();

        const result = await call('remove_section', { page: HOME, sectionId: section.id });

        expect(result.ok && (result.data as { sections: Section[] }).sections).toEqual([]);
    });

    it('refuse un type non autorisé sur la page portfolio avec le message du domaine', async () => {
        const result = await call('add_section', {
            page: HOME,
            type: 'projectCard',
            content: {},
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).toMatch(/projectCard/);
    });

    it('refuse une position hors de la grille avec le message du domaine', async () => {
        const section = await addText();

        const result = await call('move_section', {
            page: HOME,
            sectionId: section.id,
            x: 8,
            y: 0,
            w: 6,
            h: 1,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.message).not.toMatch(/failed to execute/);
    });

    it('signale une section inconnue au lieu de prétendre l’avoir modifiée', async () => {
        await addText();

        const result = await call('move_section', {
            page: HOME,
            sectionId: UNKNOWN_PORTFOLIO_ID,
            x: 0,
            y: 0,
            w: 1,
            h: 1,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('not_found');
    });

    it('ne crée aucun layout pour un portfolio inexistant', async () => {
        const page = { type: 'portfolio', portfolioId: UNKNOWN_PORTFOLIO_ID };
        const added = await call('add_section', { page, type: 'text', content: {} });
        const read = await call('get_page_layout', { page });

        expect(added.ok).toBe(false);
        expect(read.ok).toBe(false);
        if (!read.ok) expect(read.error.code).toBe('not_found');
    });

    it('ajoute une section à la page d’un projet, sans toucher la page d’accueil', async () => {
        const added = await call('add_section', {
            page: PROJECT,
            type: 'text',
            content: { html: '<h1>Noxis</h1>' },
        });
        const project = await call('get_page_layout', { page: PROJECT });
        const home = await call('get_page_layout', { page: HOME });

        expect(added.ok).toBe(true);
        expect(project.ok && project.data).toMatchObject({ pageType: 'project', pageRef: PROJECT_ID });
        expect(project.ok && (project.data as { sections: Section[] }).sections).toHaveLength(1);
        expect(!home.ok && home.error.code).toBe('not_found');
    });

    it('autorise une carte projet sur la page d’un projet', async () => {
        const result = await call('add_section', {
            page: PROJECT,
            type: 'projectCard',
            content: { projectId: PROJECT_ID },
        });

        expect(result.ok && (result.data as Section).content).toEqual({ projectId: PROJECT_ID });
    });

    it('ne crée aucun layout pour un projet inexistant', async () => {
        const page = { type: 'project', projectId: UNKNOWN_PROJECT_ID };
        const added = await call('add_section', { page, type: 'text', content: {} });
        const read = await call('get_page_layout', { page });

        expect(added.ok).toBe(false);
        expect(read.ok).toBe(false);
        if (!read.ok) expect(read.error.code).toBe('not_found');
    });

    it('refuse une page dont le type est inconnu', async () => {
        const result = await call('get_page_layout', { page: { type: 'cv', portfolioId: PORTFOLIO_ID } });

        expect(result.ok).toBe(false);
    });
});
