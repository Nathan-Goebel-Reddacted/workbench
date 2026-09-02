/**
 * Ce que le contexte Feature demande au contexte Ticket lorsqu'une feature disparaît. Il ne
 * supprime pas les tickets lui-même : il annonce la disparition, et Ticket en tire les
 * conséquences chez lui.
 */
export interface IFeatureTicketsGateway {
    /** Combien de tickets cette feature porte — pour annoncer ce qu'une suppression emporterait. */
    countOf(featureId: string): Promise<number>;

    /**
     * Supprime les tickets de cette feature. Appelé lorsque la feature est supprimée.
     * Rend les URLs que ces tickets citaient, pour que leurs fichiers puissent être libérés.
     */
    deleteAllOf(featureId: string): Promise<string[]>;
}
