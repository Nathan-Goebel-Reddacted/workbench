import { z } from 'zod';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { TicketStatus } from '@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusCommand';
import { CreateTicketCommand } from '@contexts/ticket/application/command/createTicket/createTicketCommand';
import { UpdateTicketCommand } from '@contexts/ticket/application/command/updateTicket/updateTicketCommand';
import { ChangeTicketStatusCommand } from '@contexts/ticket/application/command/changeTicketStatus/changeTicketStatusCommand';
import { DeleteTicketCommand } from '@contexts/ticket/application/command/deleteTicket/deleteTicketCommand';
import { AddTicketNoteCommand } from '@contexts/ticket/application/command/addTicketNote/addTicketNoteCommand';
import { UpdateTicketNoteCommand } from '@contexts/ticket/application/command/updateTicketNote/updateTicketNoteCommand';
import { AddTicketDocumentCommand } from '@contexts/ticket/application/command/addTicketDocument/addTicketDocumentCommand';
import { RemoveTicketDocumentCommand } from '@contexts/ticket/application/command/removeTicketDocument/removeTicketDocumentCommand';
import { GetTicketByIdQuery } from '@contexts/ticket/application/query/getTicketById/getTicketByIdQuery';
import { GetTicketsByFeatureIdQuery } from '@contexts/ticket/application/query/getTicketsByFeatureId/getTicketsByFeatureIdQuery';
import { ScopeValue } from '../../../domain/valueObject/scope';
import { AnyToolDescriptor, defineTool } from '../toolDescriptor';
import { documentSchema, uuidSchema } from './sharedSchemas';

export function createTicketTools(commandBus: CommandBus, queryBus: QueryBus): AnyToolDescriptor[] {
    const readTicket = (id: string) => queryBus.dispatch(new GetTicketByIdQuery(id));

    return [
        defineTool({
            name: 'list_tickets_of_feature',
            description:
                'List the tickets of one feature, with their reference, title, status, notes and documents. ' +
                'A ticket is the smallest unit of work. Use list_features_of_project to get a feature id.',
            scope: ScopeValue.TICKET,
            access: 'read',
            inputSchema: z.object({
                featureId: uuidSchema.describe('Id of the parent feature.'),
            }),
            execute: async ({ featureId }) => queryBus.dispatch(new GetTicketsByFeatureIdQuery(featureId)),
        }),

        defineTool({
            name: 'get_ticket',
            description: 'Get one ticket in full: reference, title, description, status, notes and documents.',
            scope: ScopeValue.TICKET,
            access: 'read',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket.'),
            }),
            execute: async ({ id }) => readTicket(id),
        }),

        defineTool({
            name: 'create_ticket',
            description:
                "Create a ticket inside an existing feature. The ticket starts in status 'pending' and the " +
                "server assigns its reference '<owner>.<feature>.<ticket>', for example '4.8.23'. " +
                'Never build a reference yourself. Returns the created ticket.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                featureId: uuidSchema.describe('Id of the feature the ticket belongs to.'),
                title: z.string().min(1).describe('Short title of the ticket.'),
                description: z.string().describe('What has to be done.'),
            }),
            execute: async ({ featureId, title, description }) => {
                const id = crypto.randomUUID();
                await commandBus.dispatch(new CreateTicketCommand(id, featureId, title, description));
                return readTicket(id);
            },
        }),

        defineTool({
            name: 'update_ticket',
            description:
                'Replace the title and description of a ticket. Both fields are overwritten, so pass the ' +
                'current value for the one you do not want to change. Does not change the status.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket to update.'),
                title: z.string().min(1).describe('New title.'),
                description: z.string().describe('New description.'),
            }),
            execute: async ({ id, title, description }) => {
                await commandBus.dispatch(new UpdateTicketCommand(id, title, description));
                return readTicket(id);
            },
        }),

        defineTool({
            name: 'change_ticket_status',
            description:
                "Move a ticket to another status: 'pending', 'in_progress' or 'finished'. A ticket held by " +
                "an idea cannot leave 'pending' — the work has not started yet. Convert the idea into a " +
                'project first.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket.'),
                status: z.enum(TicketStatus).describe("Target status: 'pending', 'in_progress' or 'finished'."),
            }),
            execute: async ({ id, status }) => {
                await commandBus.dispatch(new ChangeTicketStatusCommand(id, status));
                return readTicket(id);
            },
        }),

        defineTool({
            name: 'delete_ticket',
            description: 'Permanently delete a ticket. This is irreversible.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket to delete.'),
            }),
            execute: async ({ id }) => {
                await commandBus.dispatch(new DeleteTicketCommand(id));
                return { deleted: true, id };
            },
        }),

        defineTool({
            name: 'add_ticket_note',
            description:
                'Append a note to a ticket. Notes are an ordered log of progress and decisions; adding one ' +
                'never overwrites the previous ones.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket.'),
                note: z.string().min(1).describe('Text of the note to append.'),
            }),
            execute: async ({ id, note }) => {
                await commandBus.dispatch(new AddTicketNoteCommand(id, note));
                return readTicket(id);
            },
        }),

        defineTool({
            name: 'update_ticket_note',
            description:
                'Replace the text of one existing note, identified by its position in the notes array. ' +
                'Read the ticket first to know the index you want.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket.'),
                index: z
                    .number()
                    .int()
                    .min(0)
                    .describe('Zero-based position of the note in the notes array returned by get_ticket.'),
                note: z.string().min(1).describe('New text replacing that note.'),
            }),
            execute: async ({ id, index, note }) => {
                await commandBus.dispatch(new UpdateTicketNoteCommand(id, index, note));
                return readTicket(id);
            },
        }),

        defineTool({
            name: 'add_ticket_document',
            description:
                'Attach a document (pdf, image or video) to a ticket. The document must already be hosted ' +
                'somewhere: this tool records its URL, it does not upload a file.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: documentSchema.extend({
                id: uuidSchema.describe('Id of the ticket.'),
            }),
            execute: async ({ id, name, url, type }) => {
                await commandBus.dispatch(new AddTicketDocumentCommand(id, crypto.randomUUID(), name, url, type));
                return readTicket(id);
            },
        }),

        defineTool({
            name: 'remove_ticket_document',
            description: 'Detach a document from a ticket. The file itself is not deleted from storage.',
            scope: ScopeValue.TICKET,
            access: 'write',
            inputSchema: z.object({
                id: uuidSchema.describe('Id of the ticket.'),
                documentId: uuidSchema.describe('Id of the document, as returned by get_ticket.'),
            }),
            execute: async ({ id, documentId }) => {
                await commandBus.dispatch(new RemoveTicketDocumentCommand(id, documentId));
                return readTicket(id);
            },
        }),
    ];
}
