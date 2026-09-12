import { PairingRequestId } from './valueObject/pairingRequestId';
import { AgentToolId } from './valueObject/agentToolId';
import { Name } from './valueObject/name';
import { Permission } from './valueObject/permission';
import { Scope } from './valueObject/scope';
import { PairingCode } from './valueObject/pairingCode';
import { PairingStatusValue } from './valueObject/pairingStatus';
import { AgentToolMustKeepScopeException } from './exception/agentToolMustKeepScope';
import { PairingRequestAlreadyDecidedException } from './exception/pairingRequestAlreadyDecided';
import { PairingRequestNotApprovedException } from './exception/pairingRequestNotApproved';

/** Une demande attend une décision humaine, qui peut ne pas venir le jour même. */
export const PAIRING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Plafond de demandes simultanément en attente : personne n'a besoin de s'authentifier pour en créer une. */
export const MAX_PENDING_REQUESTS = 20;

/**
 * La demande d'un agent à être appairé.
 *
 * Ce qu'elle porte n'est pas un droit mais une proposition : les scopes et la permission
 * qu'elle annonce sont ce que l'agent souhaite, et l'approbation reste libre de les réduire.
 * Le secret, lui, n'existe qu'au moment où l'agent vient le réclamer.
 */
export class PairingRequest {
    private readonly id: PairingRequestId;
    private readonly name: Name;
    private readonly requestedScopes: Scope[];
    private readonly requestedPermission: Permission;
    private readonly code: PairingCode;
    private readonly expiresAt: Date;
    private readonly createdAt: Date;
    private status: PairingStatusValue;
    private agentToolId: AgentToolId | null;

    constructor(
        id: PairingRequestId,
        name: Name,
        requestedScopes: Scope[],
        requestedPermission: Permission,
        code: PairingCode,
        expiresAt: Date,
        status: PairingStatusValue = PairingStatusValue.PENDING,
        createdAt: Date = new Date(),
        agentToolId: AgentToolId | null = null,
    ) {
        if (requestedScopes.length === 0) {
            throw new AgentToolMustKeepScopeException();
        }
        this.id = id;
        this.name = name;
        this.requestedScopes = [...requestedScopes];
        this.requestedPermission = requestedPermission;
        this.code = code;
        this.expiresAt = expiresAt;
        this.status = status;
        this.createdAt = createdAt;
        this.agentToolId = agentToolId;
    }

    getId(): PairingRequestId {
        return this.id;
    }

    getName(): Name {
        return this.name;
    }

    getRequestedScopes(): Scope[] {
        return [...this.requestedScopes];
    }

    getRequestedPermission(): Permission {
        return this.requestedPermission;
    }

    getCode(): PairingCode {
        return this.code;
    }

    getStatus(): PairingStatusValue {
        return this.status;
    }

    getAgentToolId(): AgentToolId | null {
        return this.agentToolId;
    }

    getExpiresAt(): Date {
        return this.expiresAt;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    isExpired(now: Date = new Date()): boolean {
        return this.expiresAt.getTime() < now.getTime();
    }

    isPending(): boolean {
        return this.status === PairingStatusValue.PENDING;
    }

    /** L'agent existe désormais ; la demande retient lequel, pour le livrer à qui présentera le code. */
    approve(agentToolId: AgentToolId): void {
        if (!this.isPending()) {
            throw new PairingRequestAlreadyDecidedException(this.status);
        }
        this.status = PairingStatusValue.APPROVED;
        this.agentToolId = agentToolId;
    }

    /**
     * Le refus reste possible après une approbation : c'est la manière de revenir sur une
     * décision tant que l'agent n'est pas venu chercher son secret.
     */
    reject(): void {
        this.status = PairingStatusValue.REJECTED;
    }

    /**
     * Le code est présenté, le secret part. Une demande ne se réclame qu'une fois : l'état
     * bascule ici, et non chez l'appelant, pour qu'aucun chemin ne puisse l'oublier.
     */
    claim(): AgentToolId {
        if (this.status !== PairingStatusValue.APPROVED || this.agentToolId === null) {
            throw new PairingRequestNotApprovedException();
        }
        this.status = PairingStatusValue.CLAIMED;
        return this.agentToolId;
    }
}
