import { describe, expect, it } from 'vitest';
import { CreateIdeaMindmapHandler } from './createIdeaMindmapHandler.js';
import { CreateIdeaMindmapCommand } from './createIdeaMindmapCommand.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import type { IIdeaRepository } from '../../../domain/repository/iIdeaRepository.js';
import type { IMindmapStorage } from '@shared/application/port/iMindmapStorage.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import type { Idea } from '../../../domain/ideaAggregate.js';
import type { Document } from '@shared/domain/entity/document.js';

type Trace = string[];

const MINDMAP = { version: 1, nodes: [], edges: [] };

function idea(trace: Trace): Idea {
    return {
        addDocument: (document: Document) => trace.push(`attach:${document.getUrl()}`),
    } as unknown as Idea;
}

function repository(trace: Trace, found: Idea | null, failOnSave = false): IIdeaRepository {
    return {
        findById: async () => found,
        findAll: async () => [],
        delete: async () => {},
        save: async () => {
            if (failOnSave) throw new Error('save failed');
            trace.push('save');
        },
    };
}

function mindmaps(trace: Trace): IMindmapStorage {
    return {
        store: async content => {
            trace.push(`store:${JSON.stringify(content)}`);
            return '/uploads/m.mindmap.json';
        },
    };
}

function uploads(trace: Trace): IUploadStorage {
    return {
        release: async urls => {
            trace.push(`release:${urls.join(',')}`);
        },
        releaseFromContent: async () => {},
    };
}

const command = () => new CreateIdeaMindmapCommand('i1', 'd1', 'Plan', MINDMAP);

describe('CreateIdeaMindmapHandler', () => {
    it('écrit le mindmap puis l’attache à l’idée', async () => {
        const trace: Trace = [];
        const handler = new CreateIdeaMindmapHandler(repository(trace, idea(trace)), mindmaps(trace), uploads(trace));

        expect(await handler.handle(command())).toBe('/uploads/m.mindmap.json');
        expect(trace).toEqual([`store:${JSON.stringify(MINDMAP)}`, 'attach:/uploads/m.mindmap.json', 'save']);
    });

    it('libère le fichier si l’attache échoue', async () => {
        const trace: Trace = [];
        const handler = new CreateIdeaMindmapHandler(
            repository(trace, idea(trace), true),
            mindmaps(trace),
            uploads(trace),
        );

        await expect(handler.handle(command())).rejects.toThrow('save failed');
        expect(trace.at(-1)).toBe('release:/uploads/m.mindmap.json');
    });

    it('n’écrit rien pour une idée inconnue', async () => {
        const trace: Trace = [];
        const handler = new CreateIdeaMindmapHandler(repository(trace, null), mindmaps(trace), uploads(trace));

        await expect(handler.handle(command())).rejects.toThrow(NotFoundError);
        expect(trace).toEqual([]);
    });
});
