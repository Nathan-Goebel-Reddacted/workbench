import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateThemeCommand } from '@contexts/theme/application/command/createTheme/createThemeCommand';
import { RenameThemeCommand } from '@contexts/theme/application/command/renameTheme/renameThemeCommand';
import { RecolorThemeCommand } from '@contexts/theme/application/command/recolorTheme/recolorThemeCommand';
import { ChangeThemeVisibilityCommand } from '@contexts/theme/application/command/changeThemeVisibility/changeThemeVisibilityCommand';
import { SetDefaultThemeCommand } from '@contexts/theme/application/command/setDefaultTheme/setDefaultThemeCommand';
import { ListThemesQuery } from '@contexts/theme/application/query/listThemes/listThemesQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { uuidSchema } from './sharedSchemas';

const colorsSchema = z
    .record(z.string().min(1), z.string().min(1))
    .describe(
        'The whole palette: CSS variable name → CSS color, e.g. { "--color-bg": "#ffffff", "--color-text": "#1a1a1a" }. ' +
            'Read the variables a theme uses with list_themes; a variable left out is removed from the theme.',
    );

const nameSchema = z.string().min(1).max(60);

export function createThemeTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const listThemes = () => queryBus.dispatch(new ListThemesQuery());

    return [
        defineTool({
            name: 'list_themes',
            description:
                'List every theme of the site, hidden ones included, with its palette, its visibility (whether ' +
                'visitors can pick it) and which one is the default.',
            scope: ScopeValue.THEME,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => listThemes(),
        }),

        defineTool({
            name: 'create_theme',
            description: 'Create a theme from a palette. Returns every theme.',
            scope: ScopeValue.THEME,
            access: 'write',
            inputSchema: z.object({
                name: nameSchema.optional().describe('Theme name. A name is generated when omitted.'),
                visible: z.boolean().optional().describe('Whether visitors can pick it.'),
                colors: colorsSchema,
            }),
            execute: async ({ name, visible, colors }) => {
                await commandBus.dispatch(
                    new CreateThemeCommand(crypto.randomUUID(), name ?? null, visible ?? null, colors),
                );
                return listThemes();
            },
        }),

        defineTool({
            name: 'rename_theme',
            description: 'Rename a theme. Returns every theme.',
            scope: ScopeValue.THEME,
            access: 'write',
            inputSchema: z.object({ id: uuidSchema.describe('Id of the theme.'), name: nameSchema }),
            execute: async ({ id, name }) => {
                await commandBus.dispatch(new RenameThemeCommand(id, name));
                return listThemes();
            },
        }),

        defineTool({
            name: 'recolor_theme',
            description:
                'Replace the palette of a theme. The site shows the change at once if it is the default theme. ' +
                'Returns every theme.',
            scope: ScopeValue.THEME,
            access: 'write',
            inputSchema: z.object({ id: uuidSchema.describe('Id of the theme.'), colors: colorsSchema }),
            execute: async ({ id, colors }) => {
                await commandBus.dispatch(new RecolorThemeCommand(id, colors));
                return listThemes();
            },
        }),

        defineTool({
            name: 'set_theme_visibility',
            description: 'Let visitors pick a theme, or stop offering it. Returns every theme.',
            scope: ScopeValue.THEME,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the theme.'),
                visible: z.boolean().describe('true offers the theme to visitors, false hides it.'),
            }),
            execute: async ({ id, visible }) => {
                await commandBus.dispatch(new ChangeThemeVisibilityCommand(id, visible));
                return listThemes();
            },
        }),

        defineTool({
            name: 'set_default_theme',
            description:
                'Make a theme the one every visitor sees first. The theme must be visible. Returns every theme.',
            scope: ScopeValue.THEME,
            access: 'write',
            inputSchema: z.object({ id: uuidSchema.describe('Id of the theme.') }),
            execute: async ({ id }) => {
                await commandBus.dispatch(new SetDefaultThemeCommand(id));
                return listThemes();
            },
        }),
    ];
}
