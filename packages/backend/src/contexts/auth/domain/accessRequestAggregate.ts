import { AuthEmail } from './valueObject/email';
import { AccessRequestStatus } from './valueObject/accessRequestStatus';
/**
 * Une demande d'accès : quelqu'un s'est authentifié chez un fournisseur OAuth, son adresse est
 * donc réelle et vérifiée, mais elle n'est pas sur la liste blanche.
 *
 * L'adresse fait l'identité — il n'y a pas d'identifiant séparé. Deux tentatives de la même
 * personne rafraîchissent la même demande au lieu de s'empiler.
 */
export class AccessRequest {
    private constructor(
        private readonly email: AuthEmail,
        private displayName: string,
        private status: AccessRequestStatus,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ) {}

    /** Première tentative : la demande naît en attente d'une décision humaine. */
    static open(email: AuthEmail, displayName: string, now: Date = new Date()): AccessRequest {
        return new AccessRequest(email, displayName.trim() || email.getValue(), AccessRequestStatus.PENDING, now, now);
    }

    /** Reconstruction depuis la persistance. Pas de validation : elle a déjà eu lieu. */
    static rehydrate(
        email: AuthEmail,
        displayName: string,
        status: AccessRequestStatus,
        createdAt: Date,
        updatedAt: Date,
    ): AccessRequest {
        return new AccessRequest(email, displayName, status, createdAt, updatedAt);
    }

    getEmail(): AuthEmail {
        return this.email;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getStatus(): AccessRequestStatus {
        return this.status;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    isRejected(): boolean {
        return this.status === AccessRequestStatus.REJECTED;
    }

    /**
     * Nouvelle tentative de connexion de la même personne.
     *
     * Une demande rejetée ne revient jamais en attente : refuser quelqu'un a pour objet
     * qu'il cesse d'apparaître dans la liste, et une nouvelle tentative de sa part ne doit
     * pas le ramener sous les yeux de l'administrateur.
     */
    renew(displayName: string, now: Date = new Date()): void {
        if (this.isRejected()) return;
        this.displayName = displayName.trim() || this.email.getValue();
        this.updatedAt = now;
    }

    approve(now: Date = new Date()): void {
        this.decide(AccessRequestStatus.APPROVED, now);
    }

    reject(now: Date = new Date()): void {
        this.decide(AccessRequestStatus.REJECTED, now);
    }

    /**
     * L'administrateur peut revenir sur sa décision, dans les deux sens : il a pu rejeter par
     * erreur, ou retirer un accès accordé. Ce qui est verrouillé, c'est `renew()` — la
     * personne rejetée ne se remet pas elle-même en attente en retentant sa chance.
     *
     * Reprononcer la même décision est sans effet : un double clic n'est pas une erreur, et
     * `updatedAt` ne doit pas bouger pour rien.
     */
    private decide(status: AccessRequestStatus, now: Date): void {
        if (this.status === status) return;
        this.status = status;
        this.updatedAt = now;
    }
}
