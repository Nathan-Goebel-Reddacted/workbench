import { UploadReferenceSource } from '@shared/application/port/uploadReferenceSource';

// Les descriptions en font partie : l'éditeur riche y insère des `<img src>` pointant sur
// les uploads. Un fichier encore cité dans une description ne doit pas être effacé.
export const projectUploadReferences: UploadReferenceSource[] = [
    { table: 'projects', column: 'documents' },
    { table: 'projects', column: 'links' },
    { table: 'projects', column: 'description' },
];
