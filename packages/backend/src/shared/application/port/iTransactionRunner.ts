/**
 * Exécute un enchaînement d'écritures comme un tout : soit l'ensemble est appliqué, soit
 * rien ne l'est. Les cas d'usage qui touchent plusieurs dépôts en dépendent — sans cela,
 * un incident au milieu laisse la base dans un état qu'aucune règle métier n'autorise.
 */
export interface ITransactionRunner {
    run<T>(work: () => Promise<T>): Promise<T>;
}
