import { describe, expect, it } from 'vitest';
import { RewriteMindmapHandler } from './rewriteMindmapHandler.js';
import { RewriteMindmapCommand } from './rewriteMindmapCommand.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { NotAStoredMindmapException } from '@shared/domain/exception/notAStoredMindmap.js';
import type { IFileStorage } from '@shared/application/port/iFileStorage.js';

const NAME = '0f8fad5b-d9cb-469f-a165-70867728950e.mindmap.json';
const MINDMAP = { version: 1, nodes: [], edges: [] };

function storage(exists: boolean, written: string[]): IFileStorage {
    return {
        save: async () => '',
        read: async () => null,
        rewrite: async (filename, content) => {
            if (!exists) return false;
            written.push(`${filename}:${content}`);
            return true;
        },
    };
}

describe('RewriteMindmapHandler', () => {
    it('rewrites an existing mindmap in place and keeps its url', async () => {
        const written: string[] = [];
        const url = await new RewriteMindmapHandler(storage(true, written)).handle(
            new RewriteMindmapCommand(NAME, MINDMAP),
        );
        expect(url).toBe(`/uploads/${NAME}`);
        expect(written).toEqual([`${NAME}:${JSON.stringify(MINDMAP)}`]);
    });

    it('refuses a name the server did not generate', async () => {
        const written: string[] = [];
        await expect(
            new RewriteMindmapHandler(storage(true, written)).handle(
                new RewriteMindmapCommand('../x.mindmap.json', MINDMAP),
            ),
        ).rejects.toThrow(NotAStoredMindmapException);
        expect(written).toEqual([]);
    });

    it('reports a missing file instead of creating it', async () => {
        await expect(
            new RewriteMindmapHandler(storage(false, [])).handle(new RewriteMindmapCommand(NAME, MINDMAP)),
        ).rejects.toThrow(NotFoundError);
    });
});
