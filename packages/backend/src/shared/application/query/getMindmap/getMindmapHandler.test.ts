import { describe, expect, it } from 'vitest';
import { GetMindmapHandler } from './getMindmapHandler.js';
import { GetMindmapQuery } from './getMindmapQuery.js';
import { NotAStoredMindmapException } from '@shared/domain/exception/notAStoredMindmap.js';
import type { IFileStorage } from '@shared/application/port/iFileStorage.js';

const NAME = '0f8fad5b-d9cb-469f-a165-70867728950e.mindmap.json';
const MINDMAP = { version: 2, nodes: [], edges: [] };

function storage(files: Record<string, string>): IFileStorage {
    return {
        save: async () => '',
        rewrite: async () => true,
        read: async filename => files[filename] ?? null,
    };
}

describe('GetMindmapHandler', () => {
    it('returns the parsed content of a stored mindmap', async () => {
        const handler = new GetMindmapHandler(storage({ [NAME]: JSON.stringify(MINDMAP) }));
        expect(await handler.handle(new GetMindmapQuery(NAME))).toEqual(MINDMAP);
    });

    it('returns null for a missing mindmap', async () => {
        expect(await new GetMindmapHandler(storage({})).handle(new GetMindmapQuery(NAME))).toBeNull();
    });

    it('never reads a file the server did not name as a mindmap', async () => {
        await expect(new GetMindmapHandler(storage({})).handle(new GetMindmapQuery('../.env'))).rejects.toThrow(
            NotAStoredMindmapException,
        );
    });
});
