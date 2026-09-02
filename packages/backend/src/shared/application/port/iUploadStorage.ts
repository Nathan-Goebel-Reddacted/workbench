/**
 * Ce que l'application demande au stockage des fichiers uploadés lorsqu'une donnée qui les
 * citait disparaît. Elle ne sait pas si le fichier doit partir : elle annonce qu'elle ne le
 * cite plus, et le stockage décide en regardant s'il reste cité ailleurs.
 */
export interface IUploadStorage {
    /**
     * Libère les fichiers d'upload cités par cette valeur — une URL, un contenu de section,
     * une liste de documents. À appeler après que la donnée a été retirée de la base.
     */
    releaseFrom(value: unknown): Promise<void>;
}
