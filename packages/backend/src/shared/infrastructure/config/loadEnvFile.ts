import { fileURLToPath } from 'node:url';

// Le .env vit à la racine du monorepo, cinq niveaux au-dessus de ce fichier. Ancré sur le module
// et non sur le cwd : en production le processus démarre depuis /app alors que le code vit dans
// /app/packages/backend.
//
// Un module ESM n'est évalué qu'une fois, quel que soit le nombre d'importateurs : ce fichier est
// donc le point de chargement unique. Tout module qui lit process.env doit l'importer avant de le
// faire — sinon l'ordre d'évaluation décide si le .env était là ou non.
try {
    process.loadEnvFile(fileURLToPath(new URL('../../../../../../.env', import.meta.url)));
} catch {
    // Absent en conteneur, où les variables viennent de l'environnement : ce n'est pas une erreur.
}
