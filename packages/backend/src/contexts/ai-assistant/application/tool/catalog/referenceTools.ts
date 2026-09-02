import { z } from 'zod';
import { QueryBus } from '@shared/application/query/queryBus';
import { ResolveReferenceQuery } from '@contexts/reference/application/query/resolveReference/resolveReferenceQuery';
import { GetReferenceTreeQuery } from '@contexts/reference/application/query/getReferenceTree/getReferenceTreeQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';

/**
 * Traduire une référence lue quelque part en entités manipulables. Rattachés au scope `project` :
 * ils parcourent toute la hiérarchie, et c'est le scope le plus englobant.
 */
export function createReferenceTools(queryBus: QueryBus): AnyToolDescriptor[] {
    return [
        defineTool({
            name: 'resolve_reference',
            description:
                "Turn a human reference into the matching entities. '4' is an owner (project or idea), " +
                "'4.8' one of its features, '4.8.23' a ticket of that feature. Returns the " +
                'entity along with its parents, so a single call gives you every id you need. Use this ' +
                'whenever someone names a ticket by its number.',
            scope: ScopeValue.PROJECT,
            access: 'read',
            inputSchema: z.object({
                reference: z.string().describe("Reference to resolve: '4', '4.8' or '4.8.23'."),
            }),
            execute: async ({ reference }) => queryBus.dispatch(new ResolveReferenceQuery(reference)),
        }),

        defineTool({
            name: 'list_reference_tree',
            description:
                'List every project and idea with their features and tickets, each carrying its full ' +
                'reference. Use it to get an overview, or to find a reference you only half remember.',
            scope: ScopeValue.PROJECT,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => queryBus.dispatch(new GetReferenceTreeQuery()),
        }),
    ];
}
