import { describe, expect, it } from 'vitest';
import { createIdeaTools } from './ideaTools.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { DeleteIdeaCommand } from '@contexts/idea/application/command/deleteIdea/deleteIdeaCommand.js';
import { GetIdeaDeletionImpactQuery } from '@contexts/idea/application/query/getIdeaDeletionImpact/getIdeaDeletionImpactQuery.js';

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const IMPACT = { features: 2, tickets: 5 };
const context = { agentToolId: 'a', userId: 'u' };

function deleteIdea(deleted: string[]) {
    const commandBus = new CommandBus();
    commandBus.register(DeleteIdeaCommand.commandName, {
        handle: async (command: DeleteIdeaCommand) => {
            deleted.push(command.id);
        },
    });
    const queryBus = new QueryBus();
    queryBus.register(GetIdeaDeletionImpactQuery.queryName, { handle: async () => IMPACT });
    const tool = createIdeaTools(commandBus, queryBus).find(t => t.name === 'delete_idea');
    if (!tool) throw new Error('delete_idea is not registered');
    return tool;
}

describe('delete_idea', () => {
    it('only reports what would be lost when not confirmed', async () => {
        const deleted: string[] = [];
        const result = await deleteIdea(deleted).execute({ id: ID }, context);

        expect(result).toEqual({ deleted: false, id: ID, wouldDelete: IMPACT });
        expect(deleted).toEqual([]);
    });

    it('deletes the idea once confirmed', async () => {
        const deleted: string[] = [];
        const result = await deleteIdea(deleted).execute({ id: ID, confirm: true }, context);

        expect(result).toEqual({ deleted: true, id: ID, removed: IMPACT });
        expect(deleted).toEqual([ID]);
    });
});
