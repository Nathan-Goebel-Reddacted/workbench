import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateFeatureCommand } from '@contexts/feature/application/command/createFeature/createFeatureCommand';
import { UpdateFeatureCommand } from '@contexts/feature/application/command/updateFeature/updateFeatureCommand';
import { DeleteFeatureCommand } from '@contexts/feature/application/command/deleteFeature/deleteFeatureCommand';
import { AddFeatureDocumentCommand } from '@contexts/feature/application/command/addFeatureDocument/addFeatureDocumentCommand';
import { RemoveFeatureDocumentCommand } from '@contexts/feature/application/command/removeFeatureDocument/removeFeatureDocumentCommand';
import { GetFeatureByIdQuery } from '@contexts/feature/application/query/getFeatureById/getFeatureByIdQuery';
import { GetFeaturesByOwnerQuery } from '@contexts/feature/application/query/getFeaturesByOwner/getFeaturesByOwnerQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { documentSchema, uuidSchema, withGeneratedIds } from './sharedSchemas';

export function createFeatureTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const readFeature = (id: string) => queryBus.dispatch(new GetFeatureByIdQuery(id));

    return [
        defineTool({
            name: 'list_features_of_owner',
            description:
                'List the features of one owner — a project or an idea. A feature is a unit of work and is ' +
                'the parent of tickets. Use list_projects or list_ideas first to get an owner id. ' +
                "Each feature carries its full reference, such as '4.8'.",
            scope: ScopeValue.FEATURE,
            access: 'read',
            inputSchema: z.object({
                ownerType: z.enum(['project', 'idea']).describe("What holds the features: 'project' or 'idea'."),
                ownerId: uuidSchema.describe('Id of the parent project or idea.'),
            }),
            execute: async ({ ownerType, ownerId }) =>
                queryBus.dispatch(new GetFeaturesByOwnerQuery(ownerType, ownerId)),
        }),

        defineTool({
            name: 'get_feature',
            description:
                'Get one feature in full: name, description, owner (project or idea), full reference and ' +
                'attached documents.',
            scope: ScopeValue.FEATURE,
            access: 'read',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the feature.'),
            }),
            execute: async ({ id }) => readFeature(id),
        }),

        defineTool({
            name: 'create_feature',
            description:
                'Create a feature inside an existing project or idea. Its number is assigned by the server ' +
                'and restarts at 1 for each owner. Returns the created feature. Create the project or idea ' +
                'first if it does not exist yet.',
            scope: ScopeValue.FEATURE,
            access: 'write',
            inputSchema: z.object({
                ownerType: z
                    .enum(['project', 'idea'])
                    .default('project')
                    .describe("What the feature belongs to: 'project' or 'idea'."),
                ownerId: uuidSchema.describe('Id of the parent project or idea.'),
                name: z.string().min(1).describe('Short name of the feature.'),
                description: z.string().describe('What the feature covers.'),
                documents: z.array(documentSchema).default([]).describe('Attached files: pdf, image or video.'),
            }),
            execute: async ({ ownerType, ownerId, name, description, documents }) => {
                const id = crypto.randomUUID();
                await commandBus.dispatch(
                    new CreateFeatureCommand(id, ownerType, ownerId, name, description, withGeneratedIds(documents)),
                );
                return readFeature(id);
            },
        }),

        defineTool({
            name: 'update_feature',
            description:
                'Replace the name and description of a feature. Both fields are overwritten, so pass the ' +
                'current value for the one you do not want to change.',
            scope: ScopeValue.FEATURE,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the feature to update.'),
                name: z.string().min(1).describe('New feature name.'),
                description: z.string().describe('New description.'),
            }),
            execute: async ({ id, name, description }) => {
                await commandBus.dispatch(new UpdateFeatureCommand(id, name, description));
                return readFeature(id);
            },
        }),

        defineTool({
            name: 'delete_feature',
            // La cascade est le comportement voulu : ne plus inviter l'agent à vérifier avant.
            description:
                'Permanently delete a feature **and every ticket it holds**. This is irreversible: list its ' +
                'tickets with list_tickets_of_feature first if you need to know what will be lost.',
            scope: ScopeValue.FEATURE,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the feature to delete.'),
            }),
            execute: async ({ id }) => {
                await commandBus.dispatch(new DeleteFeatureCommand(id));
                return { deleted: true, id };
            },
        }),

        defineTool({
            name: 'add_feature_document',
            description:
                'Attach a document (pdf, image or video) to a feature. The document must already be hosted ' +
                'somewhere: this tool records its URL, it does not upload a file.',
            scope: ScopeValue.FEATURE,
            access: 'write',
            inputSchema: documentSchema.extend({
                id: uuidSchema.describe('Id of the feature.'),
            }),
            execute: async ({ id, name, url, type }) => {
                await commandBus.dispatch(new AddFeatureDocumentCommand(id, crypto.randomUUID(), name, url, type));
                return readFeature(id);
            },
        }),

        defineTool({
            name: 'remove_feature_document',
            description: 'Detach a document from a feature. The file itself is not deleted from storage.',
            scope: ScopeValue.FEATURE,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the feature.'),
                documentId: uuidSchema.describe('Id of the document, as returned by get_feature.'),
            }),
            execute: async ({ id, documentId }) => {
                await commandBus.dispatch(new RemoveFeatureDocumentCommand(id, documentId));
                return readFeature(id);
            },
        }),
    ];
}
