import { MINDMAP_SUFFIX } from './documentType';
import { UnsupportedFileTypeException } from '../exception/unsupportedFileType';
import { NotAStoredMindmapException } from '../exception/notAStoredMindmap';

// Les vidéos dépassent systématiquement le seuil qui suffisait aux images.
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

// Liste blanche : le fichier déposé est ensuite servi sans authentification sous
// /uploads/, sur l'origine de l'API. Une extension exécutable par le navigateur y ferait
// du domaine un hébergeur de script. `.svg` en fait partie — c'est un document XML qui
// porte du JavaScript — et reste donc dehors, malgré son statut d'image ailleurs.
const ALLOWED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.avif',
    '.mp4',
    '.m4v',
    '.webm',
    '.ogv',
    '.ogg',
    '.mov',
    '.mkv',
    '.avi',
    '.wmv',
    '.flv',
    '.mpeg',
    '.mpg',
    '.3gp',
    '.ts',
    '.pdf',
    MINDMAP_SUFFIX,
]);

// Seuls les mindmaps produits par le stockage sont lus ou réécrits, et leur nom est un
// UUID généré par le serveur. Ce motif est ce qui interdit à un client de désigner un
// chemin arbitraire — il ne laisse passer ni séparateur, ni '..', ni extension libre.
const STORED_MINDMAP_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mindmap\.json$/;

// `lastIndexOf('.')` ne verrait que `.json` d'un `.mindmap.json` : le suffixe composé,
// qui est ce qui distingue un mindmap d'un JSON quelconque, doit être traité à part.
function extensionOf(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith(MINDMAP_SUFFIX)) return MINDMAP_SUFFIX;

    const dotIndex = filename.lastIndexOf('.');
    return dotIndex !== -1 ? filename.slice(dotIndex).toLowerCase() : '';
}

export function storableExtension(filename: string): string {
    const extension = extensionOf(filename);
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new UnsupportedFileTypeException(extension);
    return extension;
}

export function assertStoredMindmapName(filename: string): void {
    if (!STORED_MINDMAP_NAME.test(filename)) throw new NotAStoredMindmapException();
}
