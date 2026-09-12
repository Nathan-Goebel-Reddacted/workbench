/**
 * Volontairement pas une `DomainException` : celle-ci signifie « règle métier refusée », que
 * le gestionnaire d'erreurs rend en 400. Ici la demande est valide, c'est la file qui est
 * pleine — cela se répond 429, et la route s'en charge. En faire une DomainException la
 * ferait silencieusement basculer en 400 le jour où ce rattrapage disparaîtrait.
 */
export class TooManyPendingPairingRequests extends Error {
    constructor() {
        super('Too many pending pairing requests');
    }
}
