/**
 * Toute violation d'une règle métier. Le gestionnaire d'erreurs HTTP la reconnaît et la rend
 * en 400 avec son message : celui-ci est donc destiné à l'appelant, pas au journal.
 *
 * `new.target.name` évite que chaque sous-classe réassigne son propre nom — une ligne de plus
 * à oublier, et la seule à l'être vraiment le jour où elle manque.
 */
export class DomainException extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}
