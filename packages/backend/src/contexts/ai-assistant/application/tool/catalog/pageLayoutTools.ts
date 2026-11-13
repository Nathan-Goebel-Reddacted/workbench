import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { PortfolioDto } from '@contexts/portfolio/application/query/getPortfolioById/portfolioDto';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { ProjectDto } from '@contexts/project/application/query/getProjectById/projectDto';
import { GetPageLayoutByRefQuery } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery';
import { PageLayoutDto } from '@contexts/contentEditor/application/query/getPageLayoutById/pageLayoutDto';
import { EnsurePageLayoutCommand } from '@contexts/contentEditor/application/command/ensurePageLayout/ensurePageLayoutCommand';
import { AddSectionCommand } from '@contexts/contentEditor/application/command/addSection/addSectionCommand';
import { MoveSectionCommand } from '@contexts/contentEditor/application/command/moveSection/moveSectionCommand';
import { UpdateSectionContentCommand } from '@contexts/contentEditor/application/command/updateSectionContent/updateSectionContentCommand';
import { RemoveSectionCommand } from '@contexts/contentEditor/application/command/removeSection/removeSectionCommand';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { uuidSchema } from './sharedSchemas';

const GRID_GUIDE =
    'The page is a grid of 12 columns. A section sits at column x (0-11) and row y (0 or more), spans w columns ' +
    '(1-12, x + w <= 12) and h rows. Row height follows the page width, so a row is roughly one twelfth of the ' +
    'page width tall. Sections may overlap: background and linkArea sections are drawn under the others.';

const PAGE_GUIDE =
    'Two kinds of page: the portfolio home page, and one page per project. A project page is live on the public ' +
    'site as soon as it holds a section (if the project is visible): the project then opens on it.';

const CONTENT_GUIDE =
    'Content shape per section type (missing fields take their default, unknown fields are dropped, an invalid value is rejected with a message naming the field): ' +
    "text: { html: string (rich HTML: p, h1-h4, ul, ol, a, strong, em...), scale: 'normal' | 'large' | 'display' }. " +
    "document: { url, alt, fit: 'contain' | 'cover' | 'fill', position: 'center' | 'top' | 'top left' | ..., radius: 0-64 }. " +
    'code: { code, language, wrap: boolean }. ' +
    "link: { externalLinks: [{ url, displayText, logo, style: 'link' | 'solid' | 'outline', newTab: boolean (default true) }] }. " +
    'embed: { url (http or https), title, radius: 0-64 }. ' +
    'carousel: { items: [{ url, caption }] }. ' +
    'background: { radius: 0-64 (default 8), border: boolean, dark: boolean (sections placed on a dark background switch to light text) }. ' +
    "contactForm: { title, fields: [{ id, label, type: 'text' | 'email' | 'textarea', required: boolean }], submitLabel, successMessage }. " +
    "linkArea: { target: 'url' | 'project', url, projectId, newTab: boolean } (a click anywhere on its free surface opens the target). " +
    'projectCard (project pages only): { projectId }.';

const pageSchema = z
    .discriminatedUnion('type', [
        z.object({
            type: z.literal('portfolio'),
            portfolioId: uuidSchema.describe('Id of the portfolio, as returned by get_portfolio.'),
        }),
        z.object({
            type: z.literal('project'),
            projectId: uuidSchema.describe('Id of the project, as returned by list_projects.'),
        }),
    ])
    .describe('The page to work on: the portfolio home page or the page of a project.');
const sectionIdSchema = uuidSchema.describe('Id of the section, as returned by get_page_layout.');
const contentSchema = z.record(z.string(), z.unknown()).describe(CONTENT_GUIDE);
const placementSchema = {
    x: z.number().int().min(0).max(11).describe('Column of the left edge, 0-11.'),
    y: z.number().int().min(0).describe('Row of the top edge, 0 or more.'),
    w: z.number().int().min(1).max(12).describe('Width in columns; x + w must not exceed 12.'),
    h: z.number().int().min(1).describe('Height in rows.'),
};

type Page = z.infer<typeof pageSchema>;

const refOf = (page: Page) => (page.type === 'portfolio' ? page.portfolioId : page.projectId);

export function createPageLayoutTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const pageOwnerExists = async (page: Page) =>
        page.type === 'portfolio'
            ? (await queryBus.dispatch<GetPortfolioByIdQuery, PortfolioDto | null>(
                  new GetPortfolioByIdQuery(page.portfolioId),
              )) !== null
            : (await queryBus.dispatch<GetProjectByIdQuery, ProjectDto | null>(
                  new GetProjectByIdQuery(page.projectId, true),
              )) !== null;

    const readLayout = (page: Page) =>
        queryBus.dispatch<GetPageLayoutByRefQuery, PageLayoutDto | null>(
            new GetPageLayoutByRefQuery(page.type, refOf(page), true),
        );

    const ensureLayout = async (page: Page): Promise<PageLayoutDto | null> => {
        if (!(await pageOwnerExists(page))) return null;
        await commandBus.dispatch(new EnsurePageLayoutCommand(crypto.randomUUID(), page.type, refOf(page)));
        return readLayout(page);
    };

    const persistedSection = async (page: Page, sectionId: string) =>
        (await readLayout(page))?.sections.find(section => section.id === sectionId) ?? null;

    return [
        defineTool({
            name: 'get_page_layout',
            description:
                'Get a published page: grid columns, allowed section types and every section with its id, type, ' +
                'position and content. Changes made with the other layout tools are live on the public site ' +
                'immediately: always read the layout before changing it. ' +
                PAGE_GUIDE +
                ' ' +
                GRID_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'read',
            inputSchema: z.object({ page: pageSchema }),
            execute: async ({ page }) => ((await pageOwnerExists(page)) ? readLayout(page) : null),
        }),

        defineTool({
            name: 'add_section',
            description:
                'Add a section to a page. Without x, y, w and h it goes to the next free spot. ' +
                'Returns the section as saved: compare its content with what you sent, missing fields got their ' +
                'default and unknown ones were dropped. ' +
                PAGE_GUIDE +
                ' ' +
                GRID_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                type: z.string().describe('Section type, one of allowedSectionTypes from get_page_layout.'),
                content: contentSchema,
                placement: z.object(placementSchema).optional().describe('Where to place the section.'),
            }),
            execute: async ({ page, type, content, placement }) => {
                const layout = await ensureLayout(page);
                if (!layout) return null;
                const sectionId = crypto.randomUUID();
                await commandBus.dispatch(
                    new AddSectionCommand(layout.id, sectionId, type, content, placement ?? null),
                );
                return persistedSection(page, sectionId);
            },
        }),

        defineTool({
            name: 'move_section',
            description: 'Move and/or resize a section of a page. Returns the section as saved. ' + GRID_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({ page: pageSchema, sectionId: sectionIdSchema, ...placementSchema }),
            execute: async ({ page, sectionId, x, y, w, h }) => {
                const layout = await ensureLayout(page);
                if (!layout) return null;
                await commandBus.dispatch(new MoveSectionCommand(layout.id, sectionId, x, y, w, h));
                return persistedSection(page, sectionId);
            },
        }),

        defineTool({
            name: 'update_section_content',
            description:
                'Replace the whole content of a section of a page (send every field, not only the changed ' +
                'ones): missing fields get their default. Returns the section as saved.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                sectionId: sectionIdSchema,
                content: contentSchema,
            }),
            execute: async ({ page, sectionId, content }) => {
                const layout = await ensureLayout(page);
                if (!layout) return null;
                await commandBus.dispatch(new UpdateSectionContentCommand(layout.id, sectionId, content));
                return persistedSection(page, sectionId);
            },
        }),

        defineTool({
            name: 'remove_section',
            description:
                'Remove a section from a page. There is no undo, and uploaded files referenced by its content are ' +
                'released: read its content first if it may need to be restored. Returns the layout after removal. ' +
                'A project page left without any section is no longer published.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({ page: pageSchema, sectionId: sectionIdSchema }),
            execute: async ({ page, sectionId }) => {
                const layout = await ensureLayout(page);
                if (!layout) return null;
                await commandBus.dispatch(new RemoveSectionCommand(layout.id, sectionId));
                return readLayout(page);
            },
        }),
    ];
}
