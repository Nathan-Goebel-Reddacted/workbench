import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateCvCommand } from '@contexts/cv/application/command/createCv/createCvCommand';
import { DeleteCvCommand } from '@contexts/cv/application/command/deleteCv/deleteCvCommand';
import { ReorderCvsCommand } from '@contexts/cv/application/command/reorderCvs/reorderCvsCommand';
import { SetCvVisibilityCommand } from '@contexts/cv/application/command/setCvVisibility/setCvVisibilityCommand';
import { ListCvsQuery } from '@contexts/cv/application/query/listCvs/listCvsQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { uuidSchema } from './sharedSchemas';

export function createCvTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const listCvs = () => queryBus.dispatch(new ListCvsQuery(true));

    return [
        defineTool({
            name: 'list_cvs',
            description:
                'List every CV in display order, hidden ones included, with its name, file URL and visibility. ' +
                'Visitors of the CV page only see the visible ones.',
            scope: ScopeValue.CV,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => listCvs(),
        }),

        defineTool({
            name: 'create_cv',
            description:
                'Add a CV from a pdf file. Store the file first with upload_file and pass the URL it returns. ' +
                'Returns every CV.',
            scope: ScopeValue.CV,
            access: 'write',
            inputSchema: z.object({
                name: z.string().min(1).max(255).describe('Name shown on the CV page.'),
                fileUrl: z.string().min(1).describe('URL of the CV file, as returned by upload_file.'),
            }),
            execute: async ({ name, fileUrl }) => {
                await commandBus.dispatch(new CreateCvCommand(crypto.randomUUID(), name, fileUrl));
                return listCvs();
            },
        }),

        defineTool({
            name: 'reorder_cvs',
            description: 'Set the display order of the CVs. Pass every CV id, in the wanted order. Returns every CV.',
            scope: ScopeValue.CV,
            access: 'write',
            inputSchema: z.object({
                ids: z.array(uuidSchema).min(1).describe('Every CV id, first shown first.'),
            }),
            execute: async ({ ids }) => {
                await commandBus.dispatch(new ReorderCvsCommand(ids));
                return listCvs();
            },
        }),

        defineTool({
            name: 'set_cv_visibility',
            description: 'Show or hide a CV on the public CV page. Hiding deletes nothing. Returns every CV.',
            scope: ScopeValue.CV,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the CV.'),
                visible: z.boolean().describe('true shows the CV to visitors, false hides it.'),
            }),
            execute: async ({ id, visible }) => {
                await commandBus.dispatch(new SetCvVisibilityCommand(id, visible));
                return listCvs();
            },
        }),

        defineTool({
            name: 'delete_cv',
            description:
                'Permanently delete a CV and its file. This is irreversible: use set_cv_visibility to only hide it. ' +
                'Returns every remaining CV.',
            scope: ScopeValue.CV,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the CV to delete.'),
            }),
            execute: async ({ id }) => {
                await commandBus.dispatch(new DeleteCvCommand(id));
                return listCvs();
            },
        }),
    ];
}
