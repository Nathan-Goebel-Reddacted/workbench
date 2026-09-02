export enum DocumentType {
    PDF = 'pdf',
    IMAGE = 'image',
    VIDEO = 'video',
    // Schéma créé dans l'application elle-même, persisté comme un fichier JSON servi
    // depuis /uploads. Voir ADR-009.
    MINDMAP = 'mindmap',
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];

const VIDEO_EXTENSIONS = [
    'mp4',
    'm4v',
    'webm',
    'ogv',
    'ogg',
    'mov',
    'mkv',
    'avi',
    'wmv',
    'flv',
    'mpeg',
    'mpg',
    '3gp',
    'ts',
];

function extensionOf(url: string): string {
    return url
        .slice(url.lastIndexOf('.') + 1)
        .toLowerCase()
        .split('?')[0];
}

// Le type persisté n'est pas fiable : selon le point d'entrée, les documents ont été
// enregistrés avec l'extension du fichier ('png', 'jpg', …) plutôt qu'avec DocumentType.
// La détection retombe donc sur l'extension de l'URL, comme le fait déjà l'affichage.
export function isImageDocument(type: string, url: string): boolean {
    if (type === DocumentType.IMAGE) return true;
    return IMAGE_EXTENSIONS.includes(extensionOf(url));
}

// Même tolérance que pour les images : le type persisté peut être une extension brute.
export function isVideoDocument(type: string, url: string): boolean {
    if (type === DocumentType.VIDEO) return true;
    return VIDEO_EXTENSIONS.includes(extensionOf(url));
}

// Même tolérance encore : un PDF attaché depuis le formulaire de documents porte
// souvent 'pdf' comme type, mais l'extension reste la source la plus fiable.
export function isPdfDocument(type: string, url: string): boolean {
    if (type === DocumentType.PDF) return true;
    return extensionOf(url) === 'pdf';
}

// Un mindmap est un fichier JSON : son extension ne le distingue pas d'un autre JSON,
// seul le suffixe complet le fait. Ce suffixe est aussi la convention appliquée côté
// frontend (MINDMAP_SUFFIX dans @atelier/content-renderer) — les deux doivent rester
// alignés.
export const MINDMAP_SUFFIX = '.mindmap.json';

export function isMindmapDocument(type: string, url: string): boolean {
    if (type === DocumentType.MINDMAP) return true;
    return url.split('?')[0].toLowerCase().endsWith(MINDMAP_SUFFIX);
}
