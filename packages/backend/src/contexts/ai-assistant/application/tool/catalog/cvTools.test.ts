import { describe, expect, it } from 'vitest';
import { createCvTools } from './cvTools.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateCvCommand } from '@contexts/cv/application/command/createCv/createCvCommand.js';
import { DeleteCvCommand } from '@contexts/cv/application/command/deleteCv/deleteCvCommand.js';
import { ListCvsQuery } from '@contexts/cv/application/query/listCvs/listCvsQuery.js';
import { ScopeValue } from '../../../domain/valueObject/scope.js';

const context = { agentToolId: 'a', userId: 'u' };
const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

function tools(trace: string[]) {
    const commandBus = new CommandBus();
    commandBus.register(CreateCvCommand.commandName, {
        handle: async (command: CreateCvCommand) => {
            trace.push(`create:${command.name}:${command.fileUrl}`);
        },
    });
    commandBus.register(DeleteCvCommand.commandName, {
        handle: async (command: DeleteCvCommand) => {
            trace.push(`delete:${command.id}`);
        },
    });
    const queryBus = new QueryBus();
    queryBus.register(ListCvsQuery.queryName, {
        handle: async (query: ListCvsQuery) => {
            trace.push(`list:${query.includeHidden}`);
            return [];
        },
    });
    const all = createCvTools(commandBus, queryBus);
    return (name: string) => {
        const tool = all.find(t => t.name === name);
        if (!tool) throw new Error(`${name} is not registered`);
        return tool;
    };
}

describe('CV tools', () => {
    it('all belong to the cv scope', () => {
        const names = ['list_cvs', 'create_cv', 'reorder_cvs', 'set_cv_visibility', 'delete_cv'];
        const named = tools([]);
        expect(names.map(name => named(name).scope)).toEqual(names.map(() => ScopeValue.CV));
    });

    it('creates a CV from an uploaded file and lists hidden CVs too', async () => {
        const trace: string[] = [];
        await tools(trace)('create_cv').execute({ name: 'CV 2026', fileUrl: '/uploads/cv.pdf' }, context);
        expect(trace).toEqual(['create:CV 2026:/uploads/cv.pdf', 'list:true']);
    });

    it('deletes a CV', async () => {
        const trace: string[] = [];
        await tools(trace)('delete_cv').execute({ id: ID }, context);
        expect(trace).toEqual([`delete:${ID}`, 'list:true']);
    });
});
