import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';

// Les Elements d'une Page portent leurs médias dans leurs Components (jsonb). `page_layouts`,
// l'ancien modèle, n'est plus lu mais reste en base jusqu'à son retrait : ses fichiers restent comptés.
export const contentEditorUploadReferences: UploadReferenceSource[] = [
    { table: 'page_layouts', column: 'sections' },
    { table: 'pages', column: 'elements' },
];
