import { Command } from './command';

/**
 * `R` vaut `void` par défaut : l'écrasante majorité des commandes ne rend rien, et leurs
 * handlers s'écrivent `ICommandHandler<MaCommande>` sans plus de cérémonie. Le paramètre
 * n'existe que pour les rares opérations dont l'appelant a besoin du résultat — un
 * provisionnement qui produit l'identité à signer, par exemple.
 */
export interface ICommandHandler<C extends Command, R = void> {
    handle(command: C): Promise<R>;
}
