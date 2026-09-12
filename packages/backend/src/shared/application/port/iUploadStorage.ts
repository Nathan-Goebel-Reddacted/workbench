/**
 * Ce que l'application demande au stockage des fichiers uploadés lorsqu'une donnée qui les
 * citait disparaît. Elle ne décide pas si le fichier doit partir : elle annonce qu'elle ne le
 * cite plus, et le stockage regarde s'il reste cité ailleurs avant de trancher.
 *
 * Deux opérations plutôt qu'une seule prenant `unknown` : l'appelant sait toujours lequel des
 * deux cas il est dans, et le type le dit désormais.
 */
export interface IUploadStorage {
    /** Des URLs d'upload connues — le cas courant : un document supprimé, un CV effacé. */
    release(urls: string[]): Promise<void>;

    /**
     * Un contenu arbitraire dans lequel des URLs sont enfouies — le jsonb d'une section, un
     * texte riche où l'éditeur a inséré des `<img src>`. Le stockage les y cherche lui-même.
     */
    releaseFromContent(content: unknown): Promise<void>;
}
