import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';

export const featureUploadReferences: UploadReferenceSource[] = [
    { table: 'features', column: 'documents' },
    { table: 'features', column: 'description' },
];
