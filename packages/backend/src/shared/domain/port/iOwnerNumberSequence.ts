/**
 * Alloue le numéro d'un porteur — un Project ou une Idea. La séquence est **partagée** entre les
 * deux : une idée numérotée 4 devient le projet 4 lorsqu'elle est convertie, si bien que la
 * conversion n'a aucune référence de ticket à réécrire.
 *
 * Un numéro alloué n'est jamais réattribué, même si le porteur est supprimé : la suite comporte
 * donc des trous, et c'est voulu.
 */
export interface IOwnerNumberSequence {
    next(): Promise<number>;
}
