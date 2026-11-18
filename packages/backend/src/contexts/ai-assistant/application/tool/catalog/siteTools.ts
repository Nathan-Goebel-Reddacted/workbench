import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { SetSiteAccessCommand } from '@contexts/site/application/command/setSiteAccess/setSiteAccessCommand';
import { GetSiteAccessQuery } from '@contexts/site/application/query/getSiteAccess/getSiteAccessQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';

export function createSiteTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const readAccess = () => queryBus.dispatch(new GetSiteAccessQuery());

    return [
        defineTool({
            name: 'get_site_access',
            description:
                'Tell whether the public site is open to visitors. When closed, visitors see a closed page; ' +
                'signed-in editors still see the site.',
            scope: ScopeValue.SITE,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => readAccess(),
        }),

        defineTool({
            name: 'set_site_access',
            description:
                'Open the public site to visitors, or close it (for instance during a redesign). Closing hides ' +
                'every public page from visitors at once. Returns the new access.',
            scope: ScopeValue.SITE,
            access: 'write',
            inputSchema: z.object({
                open: z.boolean().describe('true opens the site to visitors, false closes it.'),
            }),
            execute: async ({ open }) => {
                await commandBus.dispatch(new SetSiteAccessCommand(open));
                return readAccess();
            },
        }),
    ];
}
