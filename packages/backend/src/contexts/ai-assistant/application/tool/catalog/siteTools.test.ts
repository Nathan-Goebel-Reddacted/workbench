import { describe, expect, it } from 'vitest';
import { createSiteTools } from './siteTools.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { SetSiteAccessCommand } from '@contexts/site/application/command/setSiteAccess/setSiteAccessCommand.js';
import { GetSiteAccessQuery } from '@contexts/site/application/query/getSiteAccess/getSiteAccessQuery.js';
import { ScopeValue } from '../../../domain/valueObject/scope.js';

const context = { agentToolId: 'a', userId: 'u' };

describe('Site tools', () => {
    it('closes the site and returns the new access, within the site scope', async () => {
        let open = true;
        const commandBus = new CommandBus();
        commandBus.register(SetSiteAccessCommand.commandName, {
            handle: async (command: SetSiteAccessCommand) => {
                open = command.open;
            },
        });
        const queryBus = new QueryBus();
        queryBus.register(GetSiteAccessQuery.queryName, { handle: async () => ({ open }) });
        const tools = createSiteTools(commandBus, queryBus);
        const setAccess = tools.find(t => t.name === 'set_site_access');
        if (!setAccess) throw new Error('set_site_access is not registered');

        expect(await setAccess.execute({ open: false }, context)).toEqual({ open: false });
        expect(tools.map(t => t.scope)).toEqual([ScopeValue.SITE, ScopeValue.SITE]);
    });
});
