import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { Category } from '@contexts/project/application/command/createProject/createProjectCommand';
import { CreateProjectCommand } from '@contexts/project/application/command/createProject/createProjectCommand';
import { UpdateProjectCommand } from '@contexts/project/application/command/updateProject/updateProjectCommand';
import { UpdateProjectVisibilityCommand } from '@contexts/project/application/command/updateProjectVisibility/updateProjectVisibilityCommand';
import { AddProjectLinkCommand } from '@contexts/project/application/command/addProjectLink/addProjectLinkCommand';
import { RemoveProjectLinkCommand } from '@contexts/project/application/command/removeProjectLink/removeProjectLinkCommand';
import { AddProjectDocumentCommand } from '@contexts/project/application/command/addProjectDocument/addProjectDocumentCommand';
import { RemoveProjectDocumentCommand } from '@contexts/project/application/command/removeProjectDocument/removeProjectDocumentCommand';
import { GetProjectByIdQuery } from '@contexts/project/application/query/getProjectById/getProjectByIdQuery';
import { ListProjectsQuery } from '@contexts/project/application/query/listProjects/listProjectsQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { documentSchema, linkSchema, uuidSchema, withGeneratedIds } from './sharedSchemas';

export function createProjectTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    // Un agent agit pour le compte de son propriétaire, côté privé : il voit aussi les
    // projets non `visible`.
    const readProject = (id: string) => queryBus.dispatch(new GetProjectByIdQuery(id, true));

    return [
        defineTool({
            name: 'list_projects',
            description:
                'List every project of the portfolio with its name, description, category and visibility. ' +
                'Start here to discover project ids before calling any other project, feature or ticket tool.',
            scope: ScopeValue.PROJECT,
            access: 'read',
            inputSchema: z.object({}),
            execute: async () => queryBus.dispatch(new ListProjectsQuery(true)),
        }),

        defineTool({
            name: 'get_project',
            description:
                'Get one project in full: name, description, category, visibility, links and documents. ' +
                'Use list_projects first if you do not know the id.',
            scope: ScopeValue.PROJECT,
            access: 'read',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the project, as returned by list_projects.'),
            }),
            execute: async ({ id }) => readProject(id),
        }),

        defineTool({
            name: 'create_project',
            description:
                'Create a project. The project is hidden from the public site until set_project_visibility ' +
                'makes it visible. Returns the created project.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: z.object({
                name: z.string().min(1).describe('Project name, shown as the title.'),
                description: z.string().describe('What the project is about. Supports plain text.'),
                category: z
                    .enum(Category)
                    .optional()
                    .describe("'personal', 'professional' or 'academic'. Defaults to personal."),
                links: z.array(linkSchema).default([]).describe('External links, e.g. repository or live demo.'),
                documents: z.array(documentSchema).default([]).describe('Attached files: pdf, image or video.'),
            }),
            execute: async ({ name, description, category, links, documents }) => {
                const id = crypto.randomUUID();
                await commandBus.dispatch(
                    new CreateProjectCommand(id, name, description, links, withGeneratedIds(documents), category),
                );
                return readProject(id);
            },
        }),

        defineTool({
            name: 'update_project',
            description:
                'Replace the name, description and category of an existing project. ' +
                'All fields are overwritten, so pass the current value for the ones you do not want to change.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the project to update.'),
                name: z.string().min(1).describe('New project name.'),
                description: z.string().describe('New description.'),
                category: z.enum(Category).optional().describe("'personal', 'professional' or 'academic'."),
            }),
            execute: async ({ id, name, description, category }) => {
                await commandBus.dispatch(new UpdateProjectCommand(id, name, description, category));
                return readProject(id);
            },
        }),

        defineTool({
            name: 'set_project_visibility',
            description: 'Show or hide a project on the public site. Hiding a project does not delete anything.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the project.'),
                visible: z.boolean().describe('true publishes the project, false hides it.'),
            }),
            execute: async ({ id, visible }) => {
                await commandBus.dispatch(new UpdateProjectVisibilityCommand(id, visible));
                return readProject(id);
            },
        }),

        defineTool({
            name: 'add_project_link',
            description: 'Attach an external link to a project. Returns the updated project.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: linkSchema.extend({
                id: uuidSchema.describe('Id of the project.'),
            }),
            execute: async ({ id, url, displayText, logo }) => {
                await commandBus.dispatch(new AddProjectLinkCommand(id, url, displayText, logo));
                return readProject(id);
            },
        }),

        defineTool({
            name: 'remove_project_link',
            description:
                'Remove a link from a project. Links have no id: the three fields must match the existing ' +
                'link exactly, so read the project first to copy its current values.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: linkSchema.extend({
                id: uuidSchema.describe('Id of the project.'),
            }),
            execute: async ({ id, url, displayText, logo }) => {
                await commandBus.dispatch(new RemoveProjectLinkCommand(id, url, displayText, logo));
                return readProject(id);
            },
        }),

        defineTool({
            name: 'add_project_document',
            description:
                'Attach a document (pdf, image or video) to a project. The document must already be hosted ' +
                'somewhere: this tool records its URL, it does not upload a file.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: documentSchema.extend({
                id: uuidSchema.describe('Id of the project.'),
            }),
            execute: async ({ id, name, url, type }) => {
                await commandBus.dispatch(new AddProjectDocumentCommand(id, crypto.randomUUID(), name, url, type));
                return readProject(id);
            },
        }),

        defineTool({
            name: 'remove_project_document',
            description: 'Detach a document from a project. The file itself is not deleted from storage.',
            scope: ScopeValue.PROJECT,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the project.'),
                documentId: uuidSchema.describe('Id of the document, as returned by get_project.'),
            }),
            execute: async ({ id, documentId }) => {
                await commandBus.dispatch(new RemoveProjectDocumentCommand(id, documentId));
                return readProject(id);
            },
        }),
    ];
}
