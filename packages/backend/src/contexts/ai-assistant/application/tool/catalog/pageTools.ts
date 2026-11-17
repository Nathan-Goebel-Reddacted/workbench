import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { PortfolioDto } from '@contexts/portfolio/application/query/getPortfolioById/portfolioDto';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { ProjectDto } from '@contexts/project/application/query/getProjectById/projectDto';
import { GetPageByRefQuery } from '@contexts/contentEditor/application/query/getPageByRef/getPageByRefQuery';
import { PageDto } from '@contexts/contentEditor/application/query/pageDto';
import { EnsurePageCommand } from '@contexts/contentEditor/application/command/ensurePage/ensurePageCommand';
import { AddElementCommand } from '@contexts/contentEditor/application/command/addElement/addElementCommand';
import { MoveElementCommand } from '@contexts/contentEditor/application/command/moveElement/moveElementCommand';
import { ReorderElementCommand } from '@contexts/contentEditor/application/command/reorderElement/reorderElementCommand';
import { DuplicateElementCommand } from '@contexts/contentEditor/application/command/duplicateElement/duplicateElementCommand';
import { SetComponentCommand } from '@contexts/contentEditor/application/command/setComponent/setComponentCommand';
import { RemoveComponentCommand } from '@contexts/contentEditor/application/command/removeComponent/removeComponentCommand';
import { DeleteElementCommand } from '@contexts/contentEditor/application/command/deleteElement/deleteElementCommand';
import {
    COMPONENT_CATALOG,
    LINK_COMPONENT_KIND,
    PAGE_MAX_HEIGHT,
    PAGE_REFERENCE_WIDTH,
} from '@contexts/contentEditor/application/componentCatalog';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { uuidSchema } from './sharedSchemas';

const PAGE_GUIDE =
    'Two kinds of page: the portfolio home page, and one page per project. A project page is live on the public ' +
    'site as soon as one of its elements holds a content (if the project is visible): the project then opens on ' +
    'it. Every change is live on the public site immediately: read the page with get_page before changing it.';

const LAYOUT_GUIDE =
    `A page is a flat list of elements, each placed by its transform { x, y, w, h } in pixels on a reference ` +
    `width of ${PAGE_REFERENCE_WIDTH} px (x + w <= ${PAGE_REFERENCE_WIDTH}, y + h <= ${PAGE_MAX_HEIGHT}); keep values on ` +
    `multiples of 8. Elements may overlap: later elements in the list are drawn on top. The public site shows ` +
    `the page centered above ${PAGE_REFERENCE_WIDTH} px, scaled down between 1024 and ${PAGE_REFERENCE_WIDTH} px, and ` +
    `stacked top to bottom under 1024 px. A content larger than its box is cut: size the box to its content.`;

const interactiveKinds = COMPONENT_CATALOG.filter(entry => entry.role === 'content' && entry.interactive).map(
    entry => entry.kind,
);

const COMPONENT_GUIDE =
    'An element has at most one component of each kind and at most one content. Kinds: ' +
    COMPONENT_CATALOG.map(entry => `${entry.kind} (${entry.role}): ${entry.describe}`).join(' ') +
    ` A ${LINK_COMPONENT_KIND} component is refused on an interactive content (${interactiveKinds.join(', ')}). ` +
    'Missing fields take their default, unknown fields are dropped, an invalid value is rejected with a message ' +
    'naming the field. Colors take a theme variable (--color-bg, --color-surface, --color-border, --color-text, ' +
    '--color-text-muted, --color-primary, --color-primary-hover) or a hex value.';

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

const elementIdSchema = uuidSchema.describe('Id of the element, as returned by get_page.');

const transformSchema = z
    .object({
        x: z.number().int().min(0).describe('Left edge, in pixels from the left of the reference width.'),
        y: z.number().int().min(0).describe('Top edge, in pixels from the top of the page.'),
        w: z.number().int().min(1).describe(`Width in pixels; x + w must not exceed ${PAGE_REFERENCE_WIDTH}.`),
        h: z.number().int().min(1).describe(`Height in pixels; y + h must not exceed ${PAGE_MAX_HEIGHT}.`),
    })
    .refine(t => t.x + t.w <= PAGE_REFERENCE_WIDTH, { message: `x + w must not exceed ${PAGE_REFERENCE_WIDTH}` })
    .refine(t => t.y + t.h <= PAGE_MAX_HEIGHT, { message: `y + h must not exceed ${PAGE_MAX_HEIGHT}` });

const kindSchema = z
    .enum(COMPONENT_CATALOG.map(entry => entry.kind) as [string, ...string[]])
    .describe('Kind of component.');

type Page = z.infer<typeof pageSchema>;

const refOf = (page: Page) => (page.type === 'portfolio' ? page.portfolioId : page.projectId);

export function createPageTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const pageOwnerExists = async (page: Page) =>
        page.type === 'portfolio'
            ? (await queryBus.dispatch<GetPortfolioByIdQuery, PortfolioDto | null>(
                  new GetPortfolioByIdQuery(page.portfolioId),
              )) !== null
            : (await queryBus.dispatch<GetProjectByIdQuery, ProjectDto | null>(
                  new GetProjectByIdQuery(page.projectId, true),
              )) !== null;

    const readPage = (page: Page) =>
        queryBus.dispatch<GetPageByRefQuery, PageDto | null>(new GetPageByRefQuery(page.type, refOf(page), true, true));

    const ensurePage = async (page: Page): Promise<PageDto | null> => {
        if (!(await pageOwnerExists(page))) return null;
        await commandBus.dispatch(new EnsurePageCommand(crypto.randomUUID(), page.type, refOf(page)));
        return readPage(page);
    };

    const persistedElement = async (page: Page, elementId: string) =>
        (await readPage(page))?.elements.find(element => element.id === elementId) ?? null;

    const onElement = async (page: Page, change: (pageId: string) => Promise<unknown>, elementId: string) => {
        const current = await ensurePage(page);
        if (!current) return null;
        await change(current.id);
        return persistedElement(page, elementId);
    };

    return [
        defineTool({
            name: 'get_page',
            description:
                'Get a page with every element in display order (first drawn first): its id, transform, components ' +
                'and issues (missing file, private or missing project). ' +
                PAGE_GUIDE +
                ' ' +
                LAYOUT_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'read',
            inputSchema: z.object({ page: pageSchema }),
            execute: async ({ page }) => ((await pageOwnerExists(page)) ? readPage(page) : null),
        }),

        defineTool({
            name: 'add_element',
            description:
                'Add an empty element on top of a page, then give it components with set_component. Without a ' +
                'transform it is placed below the lowest element. Returns the element as saved. ' +
                LAYOUT_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                transform: transformSchema.optional().describe('Where to place the element.'),
            }),
            execute: async ({ page, transform }) => {
                const elementId = crypto.randomUUID();
                return onElement(
                    page,
                    async pageId => {
                        await commandBus.dispatch(new AddElementCommand(pageId, elementId, null));
                        if (!transform) return;
                        const { x, y, w, h } = transform;
                        await commandBus.dispatch(new MoveElementCommand(pageId, elementId, x, y, w, h));
                    },
                    elementId,
                );
            },
        }),

        defineTool({
            name: 'move_element',
            description: 'Move and/or resize an element. Returns the element as saved. ' + LAYOUT_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({ page: pageSchema, elementId: elementIdSchema, transform: transformSchema }),
            execute: async ({ page, elementId, transform: { x, y, w, h } }) =>
                onElement(
                    page,
                    pageId => commandBus.dispatch(new MoveElementCommand(pageId, elementId, x, y, w, h)),
                    elementId,
                ),
        }),

        defineTool({
            name: 'set_component',
            description:
                'Give an element a component, or replace the one of the same kind (send every field, not only the ' +
                'changed ones). Returns the element as saved: compare its components with what you sent. ' +
                COMPONENT_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                elementId: elementIdSchema,
                kind: kindSchema,
                value: z.record(z.string(), z.unknown()).describe('Fields of the component, shaped per kind.'),
            }),
            execute: async ({ page, elementId, kind, value }) =>
                onElement(
                    page,
                    pageId => commandBus.dispatch(new SetComponentCommand(pageId, elementId, kind, value)),
                    elementId,
                ),
        }),

        defineTool({
            name: 'remove_component',
            description:
                'Remove a component from an element. Uploaded files it references are released: read it first if ' +
                'it may need to be restored. Returns the element as saved.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({ page: pageSchema, elementId: elementIdSchema, kind: kindSchema }),
            execute: async ({ page, elementId, kind }) =>
                onElement(
                    page,
                    pageId => commandBus.dispatch(new RemoveComponentCommand(pageId, elementId, kind)),
                    elementId,
                ),
        }),

        defineTool({
            name: 'reorder_element',
            description:
                'Swap an element with its neighbour in display order: forward draws it one step higher, backward ' +
                'one step lower. Does nothing at either end. Returns the page as saved.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                elementId: elementIdSchema,
                direction: z.enum(['forward', 'backward']),
            }),
            execute: async ({ page, elementId, direction }) => {
                const current = await ensurePage(page);
                if (!current) return null;
                await commandBus.dispatch(new ReorderElementCommand(current.id, elementId, direction));
                return readPage(page);
            },
        }),

        defineTool({
            name: 'duplicate_element',
            description:
                'Copy an element with all its components, slightly offset and drawn just above it. Returns the copy ' +
                'as saved.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({ page: pageSchema, elementId: elementIdSchema }),
            execute: async ({ page, elementId }) => {
                const copyId = crypto.randomUUID();
                return onElement(
                    page,
                    pageId => commandBus.dispatch(new DuplicateElementCommand(pageId, elementId, copyId)),
                    copyId,
                );
            },
        }),

        defineTool({
            name: 'remove_element',
            description:
                'Remove an element and all its components. There is no undo, and uploaded files they reference are ' +
                'released: read it first if it may need to be restored. Returns the page as saved. A project page ' +
                'left without any content is no longer published.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({ page: pageSchema, elementId: elementIdSchema }),
            execute: async ({ page, elementId }) => {
                const current = await ensurePage(page);
                if (!current) return null;
                await commandBus.dispatch(new DeleteElementCommand(current.id, elementId));
                return readPage(page);
            },
        }),
    ];
}
