/**
 * Un endroit de la base où une URL d'upload peut être citée.
 *
 * Cette liste vivait en dur dans le stockage, dans le noyau partagé : ajouter un contexte
 * portant des documents demandait d'aller modifier un fichier sans rapport, et l'oublier ne
 * cassait rien de visible — cela supprimait silencieusement des fichiers encore utilisés.
 *
 * Chaque contexte déclare désormais les siens chez lui, et le composition root les rassemble.
 */
export type UploadReferenceSource = Readonly<{ table: string; column: string }>;
