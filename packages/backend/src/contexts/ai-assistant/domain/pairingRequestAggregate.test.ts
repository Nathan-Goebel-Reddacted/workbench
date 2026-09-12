import { describe, expect, it } from 'vitest';
import { PairingRequest, PAIRING_TTL_MS } from './pairingRequestAggregate.js';
import { PairingRequestId } from './valueObject/pairingRequestId.js';
import { AgentToolId } from './valueObject/agentToolId.js';
import { Name } from './valueObject/name.js';
import { Permission, PermissionValue } from './valueObject/permission.js';
import { Scope, ScopeValue } from './valueObject/scope.js';
import { PairingCode, formatPairingCode, normalizePairingCode } from './valueObject/pairingCode.js';
import { PairingStatusValue } from './valueObject/pairingStatus.js';
import { PairingRequestAlreadyDecidedException } from './exception/pairingRequestAlreadyDecided.js';
import { PairingRequestNotApprovedException } from './exception/pairingRequestNotApproved.js';
import { AgentToolMustKeepScopeException } from './exception/agentToolMustKeepScope.js';
import { InvalidPairingCodeException } from './exception/invalidPairingCode.js';

// Une demande d'appairage est le seul chemin par lequel un agent obtient une clé d'API sans
// qu'aucun humain ne se soit authentifié pour lui. Tout ce qui suit est ce qui empêche ce
// chemin de délivrer deux fois, trop tard, ou sans décision.

function request(
    status: PairingStatusValue = PairingStatusValue.PENDING,
    agentToolId: AgentToolId | null = null,
    expiresAt = new Date(Date.now() + PAIRING_TTL_MS),
): PairingRequest {
    return new PairingRequest(
        new PairingRequestId(),
        new Name('claude'),
        [new Scope(ScopeValue.PROJECT)],
        new Permission(PermissionValue.READ),
        new PairingCode('empreinte', 'ABCD'),
        expiresAt,
        status,
        new Date(),
        agentToolId,
    );
}

describe('PairingRequest — le code', () => {
    it('accepte ce qu’un humain retape : minuscules, espaces, tirets', () => {
        expect(normalizePairingCode(' abcd-2345 ')).toBe('ABCD2345');
    });

    it('s’affiche en deux groupes lisibles', () => {
        expect(formatPairingCode('ABCD2345')).toBe('ABCD-2345');
    });

    it('ne garde en clair que le préfixe, jamais le code entier', () => {
        expect(PairingCode.prefixOf('ABCD2345')).toBe('ABCD');
    });

    it('refuse une empreinte ou un préfixe vide', () => {
        expect(() => new PairingCode('', 'ABCD')).toThrow(InvalidPairingCodeException);
        expect(() => new PairingCode('empreinte', '  ')).toThrow(InvalidPairingCodeException);
    });
});

describe('PairingRequest — la décision', () => {
    it('refuse de naître sans aucun scope demandé', () => {
        expect(
            () =>
                new PairingRequest(
                    new PairingRequestId(),
                    new Name('claude'),
                    [],
                    new Permission(PermissionValue.READ),
                    new PairingCode('empreinte', 'ABCD'),
                    new Date(),
                ),
        ).toThrow(AgentToolMustKeepScopeException);
    });

    it('retient l’agent créé au moment de l’approbation', () => {
        const pending = request();
        const agent = new AgentToolId();

        pending.approve(agent);

        expect(pending.getStatus()).toBe(PairingStatusValue.APPROVED);
        expect(pending.getAgentToolId()?.equals(agent)).toBe(true);
    });

    it('ne se laisse pas approuver deux fois', () => {
        const approved = request(PairingStatusValue.APPROVED, new AgentToolId());

        expect(() => approved.approve(new AgentToolId())).toThrow(PairingRequestAlreadyDecidedException);
    });

    it('accepte d’être refusée après coup : c’est ainsi qu’on revient sur une approbation', () => {
        const approved = request(PairingStatusValue.APPROVED, new AgentToolId());

        approved.reject();

        expect(approved.getStatus()).toBe(PairingStatusValue.REJECTED);
    });
});

describe('PairingRequest — la réclamation', () => {
    it('ne livre son agent qu’une fois approuvée', () => {
        expect(() => request().claim()).toThrow(PairingRequestNotApprovedException);
    });

    it('ne se réclame pas deux fois : le secret ne part qu’une fois', () => {
        const approved = request(PairingStatusValue.APPROVED, new AgentToolId());

        approved.claim();

        expect(approved.getStatus()).toBe(PairingStatusValue.CLAIMED);
        expect(() => approved.claim()).toThrow(PairingRequestNotApprovedException);
    });

    it('ne se réclame pas après un refus', () => {
        expect(() => request(PairingStatusValue.REJECTED).claim()).toThrow(PairingRequestNotApprovedException);
    });
});

describe('PairingRequest — la péremption', () => {
    it('est vivante tant que son terme n’est pas passé', () => {
        expect(request().isExpired()).toBe(false);
    });

    it('est périmée passé son terme', () => {
        expect(request(PairingStatusValue.PENDING, null, new Date(Date.now() - 1000)).isExpired()).toBe(true);
    });
});
