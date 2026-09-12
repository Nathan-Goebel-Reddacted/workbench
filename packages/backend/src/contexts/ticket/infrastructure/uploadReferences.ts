import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';

// Les notes comptent autant que les documents : elles passent par le même éditeur riche.
export const ticketUploadReferences: UploadReferenceSource[] = [
    { table: 'tickets', column: 'documents' },
    { table: 'tickets', column: 'notes' },
    { table: 'tickets', column: 'description' },
];
