import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateIdeaCommand } from '@contexts/idea/application/command/createIdea/createIdeaCommand';
import { UpdateIdeaCommand } from '@contexts/idea/application/command/updateIdea/updateIdeaCommand';
import { AddIdeaLinkCommand } from '@contexts/idea/application/command/addIdeaLink/addIdeaLinkCommand';
import { RemoveIdeaLinkCommand } from '@contexts/idea/application/command/removeIdeaLink/removeIdeaLinkCommand';
import { AddIdeaDocumentCommand } from '@contexts/idea/application/command/addIdeaDocument/addIdeaDocumentCommand';
import { RemoveIdeaDocumentCommand } from '@contexts/idea/application/command/removeIdeaDocument/removeIdeaDocumentCommand';
import { ConvertIdeaToProjectCommand } from '@contexts/idea/application/command/convertIdeaToProject/convertIdeaToProjectCommand';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { GetIdeaByIdQuery } from '@contexts/idea/application/query/getIdeaById/getIdeaByIdQuery';
import { ListIdeasQuery } from '@contexts/idea/application/query/listIdeas/listIdeasQuery';
import { Category } from '@contexts/idea/application/command/createIdea/createIdeaCommand';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { documentSchema, linkSchema, uuidSchema, withGeneratedIds } from './sharedSchemas';

export function createIdeaTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const readIdea = (id: string) => queryBus.dispatch(new GetIdeaByIdQuery(id));

    return [
        defineTool({
            name: 'list_ideas',
            description:
                'List every idea with its id, name, description and creation date. An idea is a rough note ' +
                'that has not become a project yet. Start here to discover idea ids.',
            scope: ScopeValue.IDEA,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => queryBus.dispatch(new ListIdeasQuery()),
        }),

        defineTool({
            name: 'get_idea',
            description: 'Get one idea in full: name, description, creation date, links and documents.',
            scope: ScopeValue.IDEA,
            access: 'read',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the idea, as returned by list_ideas.'),
            }),
            execute: async ({ id }) => readIdea(id),
        }),

        defineTool({
            name: 'create_idea',
            description:
                'Capture a new idea. An idea holds a name, a description, a category, links and documents. ' +
                'Returns the created idea.',
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: z.object({
                name: z.string().min(1).describe('Short title of the idea.'),
                description: z.string().min(1).describe('The idea itself, in plain text.'),
                category: z
                    .enum(Category)
                    .default(Category.Personal)
                    .describe("What kind of idea it is: 'personal', 'professional' or 'academic'."),
                links: z.array(linkSchema).default([]).describe('External links backing the idea.'),
                documents: z.array(documentSchema).default([]).describe('Attached files: pdf, image or video.'),
            }),
            execute: async ({ name, description, category, links, documents }) => {
                const id = crypto.randomUUID();
                await commandBus.dispatch(
                    new CreateIdeaCommand(id, name, description, links, withGeneratedIds(documents), category),
                );
                return readIdea(id);
            },
        }),

        defineTool({
            name: 'update_idea',
            description:
                'Replace the name, description and category of an existing idea. All fields are overwritten, ' +
                'so pass the current value for the ones you do not want to change. Links and documents are ' +
                'left untouched.',
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the idea to update.'),
                name: z.string().min(1).describe('New name of the idea.'),
                description: z.string().describe('New description, in plain text.'),
                category: z
                    .enum(Category)
                    .optional()
                    .describe("New category: 'personal', 'professional' or 'academic'. Left unchanged if omitted."),
            }),
            execute: async ({ id, name, description, category }) => {
                await commandBus.dispatch(new UpdateIdeaCommand(id, name, description, category));
                return readIdea(id);
            },
        }),

        defineTool({
            name: 'convert_idea_to_project',
            description:
                "Turn an idea into a project: the project keeps the idea's name, description, category, " +
                'links, documents and number, and inherits its features and tickets. **The idea is then ' +
                'deleted** — this is irreversible. The new project starts private. Ticket references do not ' +
                "change, since the project reuses the idea's number.",
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the idea to convert.'),
                category: z
                    .enum(Category)
                    .optional()
                    .describe("Category of the resulting project. Defaults to the idea's own category."),
            }),
            execute: async ({ id, category }) => {
                const projectId = crypto.randomUUID();
                await commandBus.dispatch(new ConvertIdeaToProjectCommand(id, projectId, category));
                return queryBus.dispatch(new GetProjectByIdQuery(projectId, true));
            },
        }),

        defineTool({
            name: 'add_idea_link',
            description: 'Attach an external link to an idea. Returns the updated idea.',
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: linkSchema.extend({
                id: uuidSchema.describe('Id of the idea.'),
            }),
            execute: async ({ id, url, displayText, logo }) => {
                await commandBus.dispatch(new AddIdeaLinkCommand(id, url, displayText, logo));
                return readIdea(id);
            },
        }),

        defineTool({
            name: 'remove_idea_link',
            description:
                'Remove a link from an idea. Links have no id: the three fields must match the existing link ' +
                'exactly, so read the idea first to copy its current values.',
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: linkSchema.extend({
                id: uuidSchema.describe('Id of the idea.'),
            }),
            execute: async ({ id, url, displayText, logo }) => {
                await commandBus.dispatch(new RemoveIdeaLinkCommand(id, url, displayText, logo));
                return readIdea(id);
            },
        }),

        defineTool({
            name: 'add_idea_document',
            description:
                'Attach a document (pdf, image or video) to an idea. The document must already be hosted ' +
                'somewhere: this tool records its URL, it does not upload a file.',
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: documentSchema.extend({
                id: uuidSchema.describe('Id of the idea.'),
            }),
            execute: async ({ id, name, url, type }) => {
                await commandBus.dispatch(new AddIdeaDocumentCommand(id, crypto.randomUUID(), name, url, type));
                return readIdea(id);
            },
        }),

        defineTool({
            name: 'remove_idea_document',
            description: 'Detach a document from an idea. The file itself is not deleted from storage.',
            scope: ScopeValue.IDEA,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the idea.'),
                documentId: uuidSchema.describe('Id of the document, as returned by get_idea.'),
            }),
            execute: async ({ id, documentId }) => {
                await commandBus.dispatch(new RemoveIdeaDocumentCommand(id, documentId));
                return readIdea(id);
            },
        }),
    ];
}
