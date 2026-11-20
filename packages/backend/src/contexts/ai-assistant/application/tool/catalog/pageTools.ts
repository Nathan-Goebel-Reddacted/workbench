import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { GetPortfolioByIdQuery } from '@contexts/portfolio/application/query/getPortfolioById/getPortfolioByIdQuery';
import { PortfolioDto } from '@contexts/portfolio/application/query/getPortfolioById/portfolioDto';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { ProjectDto } from '@contexts/project/application/query/getProjectById/projectDto';
import { GetPageByRefQuery } from '@contexts/contentEditor/application/query/getPageByRef/getPageByRefQuery';
import { PageDto } from '@contexts/contentEditor/application/query/pageDto';
import { ListMediaImagesQuery } from '@contexts/contentEditor/application/query/listMediaImages/listMediaImagesQuery';
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
    PAGE_DERIVED_SCREENS,
    PAGE_SCREEN_MAX_HEIGHTS,
    PAGE_SCREEN_WIDTHS,
    PAGE_SCREENS,
} from '@contexts/contentEditor/application/componentCatalog';
import { HideElementCommand } from '@contexts/contentEditor/application/command/hideElement/hideElementCommand';
import { RegenerateLayoutCommand } from '@contexts/contentEditor/application/command/regenerateLayout/regenerateLayoutCommand';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { uuidSchema } from './sharedSchemas';

const PAGE_GUIDE =
    'Two kinds of page: the portfolio home page, and one page per project. A project page is live on the public ' +
    'site as soon as one of its elements holds a content (if the project is visible): the project then opens on ' +
    'it. Every change is live on the public site immediately: read the page with get_page before changing it.';

const SCREEN_LIST = PAGE_SCREENS.map(
    screen => `${screen} ${PAGE_SCREEN_WIDTHS[screen]} px wide (y + h <= ${PAGE_SCREEN_MAX_HEIGHTS[screen]})`,
).join(', ');

const LAYOUT_GUIDE =
    `A page is a flat list of elements. Each element has one placement per screen size: ${SCREEN_LIST}. A ` +
    `placement is a transform { x, y, w, h } in pixels on the width of its screen size (x + w <= that width), ` +
    `plus a hidden flag; keep values on multiples of 8. Each width is a minimum: the public site shows desktop ` +
    `from ${PAGE_SCREEN_WIDTHS.desktop} px, tablet from ${PAGE_SCREEN_WIDTHS.tablet} px and mobile below, each ` +
    `drawn at its own width, pixel for pixel, and centered with side margins on a wider window; only a window ` +
    `narrower than mobile scales the mobile layout down. Text is shown at its set size. Compose desktop ` +
    `first: a new element is placed full width at the bottom of tablet and mobile, and its first content sets its ` +
    `tablet and mobile height from its desktop box. regenerate_layout then rebuilds tablet or mobile from desktop ` +
    `(desktop rows read top to bottom and left to right, stacked full width), overwriting that screen size; ` +
    `retouch it afterwards with move_element and hide_element. Elements may overlap: later elements in the list ` +
    `are drawn on top. A content larger than its box is cut: size the box to its content.`;

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
        x: z.number().int().min(0).describe('Left edge, in pixels from the left of the screen size width.'),
        y: z.number().int().min(0).describe('Top edge, in pixels from the top of the page.'),
        w: z.number().int().min(1).describe('Width in pixels; x + w must not exceed the screen size width.'),
        h: z.number().int().min(1).describe('Height in pixels; y + h must not exceed the screen size max height.'),
    })
    .describe('Where to place the element on the screen size.');

type ScreenName = (typeof PAGE_SCREENS)[number];

const screenSchema = z
    .enum(PAGE_SCREENS as [ScreenName, ...ScreenName[]])
    .default('desktop')
    .describe('The screen size to work on; desktop by default.');

function checkBounds(
    input: { screen: ScreenName; transform?: z.infer<typeof transformSchema> },
    ctx: z.RefinementCtx,
): void {
    const t = input.transform;
    if (!t) return;
    const width = PAGE_SCREEN_WIDTHS[input.screen];
    const maxHeight = PAGE_SCREEN_MAX_HEIGHTS[input.screen];
    if (t.x + t.w > width) {
        ctx.addIssue({
            code: 'custom',
            path: ['transform'],
            message: `x + w must not exceed ${width} on ${input.screen}`,
        });
    }
    if (t.y + t.h > maxHeight) {
        ctx.addIssue({
            code: 'custom',
            path: ['transform'],
            message: `y + h must not exceed ${maxHeight} on ${input.screen}`,
        });
    }
}

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
            name: 'list_media',
            description:
                'List the files already attached to projects, features and tickets, grouped by project, to pick a ' +
                'source for a page component. kind: image, video, mindmap, or document (every displayable file: ' +
                'image, video, mindmap and pdf). To add a new file, store it with upload_file.',
            scope: ScopeValue.PORTFOLIO,
            access: 'read',
            inputSchema: z.object({
                kind: z.enum(['image', 'video', 'mindmap', 'document']).describe('Which files to list.'),
            }),
            execute: async ({ kind }) => queryBus.dispatch(new ListMediaImagesQuery(kind)),
        }),

        defineTool({
            name: 'get_page',
            description:
                'Get a page with every element in display order (first drawn first): its id, layout (one placement ' +
                'per screen size), components and issues (missing file, private or missing project). ' +
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
                'transform it is placed below the lowest element on every screen size; with one, the transform ' +
                'applies to the given screen size. Returns the element as saved. ' +
                LAYOUT_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z
                .object({ page: pageSchema, screen: screenSchema, transform: transformSchema.optional() })
                .superRefine(checkBounds),
            execute: async ({ page, screen, transform }) => {
                const elementId = crypto.randomUUID();
                return onElement(
                    page,
                    async pageId => {
                        await commandBus.dispatch(
                            new AddElementCommand(pageId, elementId, transform ? screen : 'desktop', null),
                        );
                        if (!transform) return;
                        const { x, y, w, h } = transform;
                        await commandBus.dispatch(new MoveElementCommand(pageId, elementId, screen, x, y, w, h));
                    },
                    elementId,
                );
            },
        }),

        defineTool({
            name: 'move_element',
            description:
                'Move and/or resize an element on one screen size; the other screen sizes keep their placement. ' +
                'Returns the element as saved. ' +
                LAYOUT_GUIDE,
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z
                .object({
                    page: pageSchema,
                    elementId: elementIdSchema,
                    screen: screenSchema,
                    transform: transformSchema,
                })
                .superRefine(checkBounds),
            execute: async ({ page, elementId, screen, transform: { x, y, w, h } }) =>
                onElement(
                    page,
                    pageId => commandBus.dispatch(new MoveElementCommand(pageId, elementId, screen, x, y, w, h)),
                    elementId,
                ),
        }),

        defineTool({
            name: 'hide_element',
            description:
                'Hide an element on one screen size, or show it again; it keeps its placement. A hidden element ' +
                'takes no room in the page height nor in the reading order of that screen size. Hidden on every ' +
                'screen size, its content no longer publishes a project page. Returns the element as saved.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                elementId: elementIdSchema,
                screen: screenSchema,
                hidden: z.boolean().default(true).describe('true hides the element, false shows it again.'),
            }),
            execute: async ({ page, elementId, screen, hidden }) =>
                onElement(
                    page,
                    pageId => commandBus.dispatch(new HideElementCommand(pageId, elementId, screen, hidden)),
                    elementId,
                ),
        }),

        defineTool({
            name: 'regenerate_layout',
            description:
                'Rebuild the tablet or mobile placement of every element from desktop, overwriting every retouch ' +
                'made on that screen size: desktop rows are read top to bottom and left to right and stacked full ' +
                'width; elements hidden on desktop go last, hidden. Returns the page as saved.',
            scope: ScopeValue.PORTFOLIO,
            access: 'write',
            inputSchema: z.object({
                page: pageSchema,
                screen: z.enum(PAGE_DERIVED_SCREENS).describe('The screen size to rebuild.'),
            }),
            execute: async ({ page, screen }) => {
                const current = await ensurePage(page);
                if (!current) return null;
                await commandBus.dispatch(new RegenerateLayoutCommand(current.id, screen));
                return readPage(page);
            },
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
