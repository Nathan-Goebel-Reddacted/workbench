import { describe, expect, it } from 'vitest';
import { CreateProjectMindmapHandler } from './createProjectMindmapHandler.js';
import { CreateProjectMindmapCommand } from './createProjectMindmapCommand.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import type { IProjectRepository } from '../../../domain/repository/iProjectRepository.js';
import type { IMindmapStorage } from '@shared/application/port/iMindmapStorage.js';
import type { IUploadStorage } from '@shared/application/port/iUploadStorage.js';
import type { Project } from '../../../domain/projectAggregate.js';
import type { Document } from '@shared/domain/entity/document.js';

type Trace = string[];

const MINDMAP = { version: 1, nodes: [], edges: [] };

function project(trace: Trace): Project {
    return {
        addDocument: (document: Document) => trace.push(`attach:${document.getUrl()}`),
    } as unknown as Project;
}

function repository(trace: Trace, found: Project | null, failOnSave = false): IProjectRepository {
    return {
        findById: async () => found,
        findAll: async () => [],
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

const command = () => new CreateProjectMindmapCommand('p1', 'd1', 'Plan', MINDMAP);

describe('CreateProjectMindmapHandler', () => {
    it('écrit le mindmap puis l’attache au projet', async () => {
        const trace: Trace = [];
        const handler = new CreateProjectMindmapHandler(
            repository(trace, project(trace)),
            mindmaps(trace),
            uploads(trace),
        );

        expect(await handler.handle(command())).toBe('/uploads/m.mindmap.json');
        expect(trace).toEqual([`store:${JSON.stringify(MINDMAP)}`, 'attach:/uploads/m.mindmap.json', 'save']);
    });

    it('libère le fichier si l’attache échoue', async () => {
        const trace: Trace = [];
        const handler = new CreateProjectMindmapHandler(
            repository(trace, project(trace), true),
            mindmaps(trace),
            uploads(trace),
        );

        await expect(handler.handle(command())).rejects.toThrow('save failed');
        expect(trace.at(-1)).toBe('release:/uploads/m.mindmap.json');
    });

    it('n’écrit rien pour un projet inconnu', async () => {
        const trace: Trace = [];
        const handler = new CreateProjectMindmapHandler(repository(trace, null), mindmaps(trace), uploads(trace));

        await expect(handler.handle(command())).rejects.toThrow(NotFoundError);
        expect(trace).toEqual([]);
    });
});
