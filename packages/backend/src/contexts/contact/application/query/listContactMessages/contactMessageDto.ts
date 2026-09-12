import { ContactField } from '../../../domain/contactMessageAggregate';

export type ContactMessageDto = {
    id: string;
    fields: ContactField[];
    senderEmail: string | null;
    submittedAt: string;
    mailSent: boolean;
};
