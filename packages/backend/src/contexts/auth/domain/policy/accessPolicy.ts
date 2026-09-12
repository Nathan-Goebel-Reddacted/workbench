import { UserRole } from '@shared/domain/valueObject/userRole';
import { AuthEmail } from '../valueObject/email';

/**
 * Qui a le droit d'entrer, et avec quel rôle.
 *
 * C'est la règle la plus sensible de l'application, et elle vivait jusqu'ici au milieu d'un
 * gestionnaire de route HTTP, mêlée aux appels réseau vers GitHub et à la pose du cookie.
 * Elle est ici seule, sans dépendance, et donc vérifiable.
 *
 * L'adresse d'amorçage est une donnée de déploiement (`BOOTSTRAP_ADMIN_EMAIL`) : la politique
 * la reçoit, elle ne va pas la chercher.
 */
export class AccessPolicy {
    constructor(private readonly bootstrapAdmin: AuthEmail | null) {}

    /**
     * Rôles accordés à un compte créé à sa première connexion.
     *
     * `view` est le plancher : un compte autorisé sans rôle se connecterait pour ne rien
     * pouvoir lire, alors que l'accès lui a précisément été accordé en amont par l'ajout de
     * son adresse à la liste blanche.
     *
     * L'adresse d'amorçage reçoit `edit`, sinon la première connexion sur une base vierge
     * produirait un compte incapable d'ouvrir la liste blanche à qui que ce soit — y compris
     * à lui-même.
     */
    rolesForNewAccount(email: AuthEmail): UserRole[] {
        return this.isBootstrapAdmin(email) ? [UserRole.EDIT] : [UserRole.VIEW];
    }

    isBootstrapAdmin(email: AuthEmail): boolean {
        return this.bootstrapAdmin !== null && this.bootstrapAdmin.equals(email);
    }
}
