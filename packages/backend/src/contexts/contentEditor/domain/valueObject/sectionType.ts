export enum SectionType {
    TEXT = 'text',
    // Document unitaire : image, vidéo, PDF ou mindmap. La forme du rendu se déduit
    // de l'URL côté renderer — un seul type de section pour les quatre.
    // Remplace les anciens IMAGE et VIDEO, convertis par migration.
    DOCUMENT = 'document',
    CODE = 'code',
    LINK = 'link',
    EMBED = 'embed',
    CAROUSEL = 'carousel',
    PROJECT_CARD = 'projectCard',
    // Aplat décoratif : se place sous les autres widgets et alterne fond / surface
    // selon les fonds qui le contiennent.
    BACKGROUND = 'background',
    // Seul widget interactif : le visiteur y saisit un message, envoyé par mail au propriétaire.
    CONTACT_FORM = 'contactForm',
    // Zone transparente posée sous les autres widgets : tout clic dans sa surface libre
    // ouvre une URL externe ou la page d'un projet.
    LINK_AREA = 'linkArea',
}
