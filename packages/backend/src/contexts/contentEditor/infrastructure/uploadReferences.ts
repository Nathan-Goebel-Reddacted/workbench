import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';

// Les sections d'une page portent leurs médias dans leur contenu jsonb.
export const contentEditorUploadReferences: UploadReferenceSource[] = [{ table: 'page_layouts', column: 'sections' }];
