import { describe, expect, it } from 'vitest';
import { createThemeTools } from './themeTools.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateThemeCommand } from '@contexts/theme/application/command/createTheme/createThemeCommand.js';
import { RecolorThemeCommand } from '@contexts/theme/application/command/recolorTheme/recolorThemeCommand.js';
import { ListThemesQuery } from '@contexts/theme/application/query/listThemes/listThemesQuery.js';
import { ScopeValue } from '../../../domain/valueObject/scope.js';

const context = { agentToolId: 'a', userId: 'u' };
const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const COLORS = { '--color-bg': '#ffffff', '--color-text': '#111111' };

function tools(trace: unknown[]) {
    const commandBus = new CommandBus();
    commandBus.register(CreateThemeCommand.commandName, {
        handle: async (command: CreateThemeCommand) => {
            trace.push({ create: [command.name, command.visible, command.colors] });
        },
    });
    commandBus.register(RecolorThemeCommand.commandName, {
        handle: async (command: RecolorThemeCommand) => {
            trace.push({ recolor: [command.id, command.colors] });
        },
    });
    const queryBus = new QueryBus();
    queryBus.register(ListThemesQuery.queryName, { handle: async () => ({ themes: [] }) });
    const all = createThemeTools(commandBus, queryBus);
    return (name: string) => {
        const tool = all.find(t => t.name === name);
        if (!tool) throw new Error(`${name} is not registered`);
        return tool;
    };
}

describe('Theme tools', () => {
    it('all belong to the theme scope', () => {
        const names = [
            'list_themes',
            'create_theme',
            'rename_theme',
            'recolor_theme',
            'set_theme_visibility',
            'set_default_theme',
        ];
        const named = tools([]);
        expect(names.map(name => named(name).scope)).toEqual(names.map(() => ScopeValue.THEME));
    });

    it('lets the backend choose the name and visibility when they are omitted', async () => {
        const trace: unknown[] = [];
        const tool = tools(trace)('create_theme');
        await tool.execute(tool.inputSchema.parse({ colors: COLORS }), context);
        expect(trace).toEqual([{ create: [null, null, COLORS] }]);
    });

    it('replaces the palette of a theme', async () => {
        const trace: unknown[] = [];
        const tool = tools(trace)('recolor_theme');
        await tool.execute(tool.inputSchema.parse({ id: ID, colors: COLORS }), context);
        expect(trace).toEqual([{ recolor: [ID, COLORS] }]);
    });

    it('refuses an empty color value', () => {
        const tool = tools([])('recolor_theme');
        expect(tool.inputSchema.safeParse({ id: ID, colors: { '--color-bg': '' } }).success).toBe(false);
    });
});
