import { describe, expect, it } from 'vitest';
import { createUploadTools } from './uploadTools.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { StoreUploadCommand } from '@shared/application/command/storeUpload/storeUploadCommand.js';
import { UploadRateExceededException } from '../../../domain/exception/uploadRateExceeded.js';
import { RewriteMindmapCommand } from '@shared/application/command/rewriteMindmap/rewriteMindmapCommand.js';

function uploadTool(received: StoreUploadCommand[], now: () => number = Date.now) {
    const commandBus = new CommandBus();
    commandBus.register(StoreUploadCommand.commandName, {
        handle: async (command: StoreUploadCommand) => {
            received.push(command);
            return '/uploads/new.png';
        },
    });
    const tool = createUploadTools(commandBus, new QueryBus(), now).find(t => t.name === 'upload_file');
    if (!tool) throw new Error('upload_file is not registered');
    return tool;
}

describe('upload_file', () => {
    it('decodes the base64 content and returns the stored url', async () => {
        const received: StoreUploadCommand[] = [];
        const tool = uploadTool(received);
        const input = tool.inputSchema.parse({
            filename: 'cover.png',
            contentBase64: Buffer.from('hello').toString('base64'),
        });

        const result = await tool.execute(input, { agentToolId: 'a', userId: 'u' });

        expect(result).toEqual({ url: '/uploads/new.png' });
        expect(received[0].filename).toBe('cover.png');
        expect(received[0].content.toString()).toBe('hello');
    });

    it('allows 60 uploads per agent every 15 minutes, like the interface', async () => {
        let clock = 0;
        const tool = uploadTool([], () => clock);
        const input = { filename: 'a.png', contentBase64: Buffer.from('x').toString('base64') };
        const asAgent = (agentToolId: string) => tool.execute(input, { agentToolId, userId: 'u' });

        for (let i = 0; i < 60; i++) await asAgent('a');
        await expect(asAgent('a')).rejects.toThrow(UploadRateExceededException);
        await expect(asAgent('b')).resolves.toEqual({ url: '/uploads/new.png' });

        clock = 15 * 60 * 1000 + 1;
        await expect(asAgent('a')).resolves.toEqual({ url: '/uploads/new.png' });
    });

    it('rejects content that is not base64', () => {
        const tool = uploadTool([]);
        expect(tool.inputSchema.safeParse({ filename: 'a.png', contentBase64: 'not base64!' }).success).toBe(false);
    });
});

describe('update_mindmap', () => {
    const NAME = '0f8fad5b-d9cb-469f-a165-70867728950e.mindmap.json';
    const MINDMAP = {
        version: 2,
        nodes: [{ id: 'n1', kind: 'mind', text: 'Root', x: 0, y: 0 }],
        edges: [],
    };

    function updateTool(received: RewriteMindmapCommand[]) {
        const commandBus = new CommandBus();
        commandBus.register(RewriteMindmapCommand.commandName, {
            handle: async (command: RewriteMindmapCommand) => {
                received.push(command);
                return `/uploads/${command.filename}`;
            },
        });
        const tool = createUploadTools(commandBus, new QueryBus()).find(t => t.name === 'update_mindmap');
        if (!tool) throw new Error('update_mindmap is not registered');
        return tool;
    }

    it('rewrites the file named by the url, absolute or not', async () => {
        const received: RewriteMindmapCommand[] = [];
        const tool = updateTool(received);
        const input = tool.inputSchema.parse({ url: `https://example.org/uploads/${NAME}?v=3`, content: MINDMAP });

        const result = await tool.execute(input, { agentToolId: 'a', userId: 'u' });

        expect(result).toEqual({ url: `/uploads/${NAME}` });
        expect(received[0].filename).toBe(NAME);
    });

    it('keeps fields a newer editor added', () => {
        const tool = updateTool([]);
        const content = { ...MINDMAP, theme: 'dark', nodes: [{ ...MINDMAP.nodes[0], icon: 'star' }] };
        const parsed = tool.inputSchema.parse({ url: `/uploads/${NAME}`, content }) as { content: typeof content };
        expect(parsed.content.theme).toBe('dark');
        expect(parsed.content.nodes[0].icon).toBe('star');
    });

    it('rejects a node kind the editor does not draw', () => {
        const tool = updateTool([]);
        const content = { ...MINDMAP, nodes: [{ ...MINDMAP.nodes[0], kind: 'circle' }] };
        expect(tool.inputSchema.safeParse({ url: `/uploads/${NAME}`, content }).success).toBe(false);
    });
});
