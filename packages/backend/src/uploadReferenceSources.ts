import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';
import { projectUploadReferences } from '@contexts/project/infrastructure/uploadReferences';
import { ideaUploadReferences } from '@contexts/idea/infrastructure/uploadReferences';
import { featureUploadReferences } from '@contexts/feature/infrastructure/uploadReferences';
import { ticketUploadReferences } from '@contexts/ticket/infrastructure/uploadReferences';
import { cvUploadReferences } from '@contexts/cv/infrastructure/uploadReferences';
import { contentEditorUploadReferences } from '@contexts/contentEditor/infrastructure/uploadReferences';

export const UPLOAD_REFERENCE_SOURCES: readonly UploadReferenceSource[] = [
    ...projectUploadReferences,
    ...ideaUploadReferences,
    ...featureUploadReferences,
    ...ticketUploadReferences,
    ...cvUploadReferences,
    ...contentEditorUploadReferences,
];
