import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';

export const ideaUploadReferences: UploadReferenceSource[] = [
    { table: 'ideas', column: 'documents' },
    { table: 'ideas', column: 'links' },
    { table: 'ideas', column: 'description' },
];
