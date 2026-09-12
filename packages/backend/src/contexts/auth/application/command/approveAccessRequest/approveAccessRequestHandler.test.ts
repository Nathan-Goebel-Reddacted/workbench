import { describe, expect, it } from 'vitest';
import { ApproveAccessRequestHandler } from './approveAccessRequestHandler.js';
import { ApproveAccessRequestCommand } from './approveAccessRequestCommand.js';
import { AccessRequest } from '../../../domain/accessRequestAggregate.js';
import { AccessRequestStatus } from '../../../domain/valueObject/accessRequestStatus.js';
import { AuthEmail } from '../../../domain/valueObject/email.js';
import { EmailAlreadyAllowedException } from '../../../domain/exception/emailAlreadyAllowed.js';
import { NotFoundError } from '@shared/application/errors/notFoundError.js';
import { FakeTransactionRunner } from '@shared/application/port/transactionRunnerDouble.js';
import type { IAccessRequestRepository } from '../../../domain/repository/iAccessRequestRepository.js';
import type { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository.js';

// Approuver, c'est marquer la demande ET ouvrir la liste blanche. Les deux écritures étaient
// séparées : un incident entre elles laissait soit une demande approuvée qui ne laisse pas
// entrer, soit une adresse autorisée dont la demande reste affichée en attente. Aucun des
// deux états n'est rattrapable depuis les écrans.

const EMAIL = 'visiteur@example.com';

function requests(stored: AccessRequest | null) {
    const saved: AccessRequest[] = [];
    const repo: IAccessRequestRepository = {
        findByEmail: async () => stored,
        findAll: async () => (stored ? [stored] : []),
        save: async request => void saved.push(request),
    };
    return { repo, saved };
}

function allowList(options: { alreadyThere?: boolean; failsWith?: Error } = {}) {
    const added: string[] = [];
    const repo: IAllowedEmailRepository = {
        contains: async () => options.alreadyThere === true,
        findAll: async () => [],
        add: async email => {
            if (options.failsWith) throw options.failsWith;
            if (options.alreadyThere) throw new EmailAlreadyAllowedException(email.getValue());
            added.push(email.getValue());
        },
        remove: async () => {},
    };
    return { repo, added };
}

describe('ApproveAccessRequestHandler', () => {
    it('marque la demande et ouvre la liste blanche dans une seule transaction', async () => {
        const request = AccessRequest.open(new AuthEmail(EMAIL), 'Jean');
        const r = requests(request);
        const a = allowList();
        const tx = new FakeTransactionRunner();

        await new ApproveAccessRequestHandler(r.repo, a.repo, tx).handle(new ApproveAccessRequestCommand(EMAIL));

        expect(request.getStatus()).toBe(AccessRequestStatus.APPROVED);
        expect(r.saved).toHaveLength(1);
        expect(a.added).toEqual([EMAIL]);
        expect(tx.committed).toBe(1);
    });

    it('reste satisfait si l’adresse était déjà autorisée', async () => {
        const request = AccessRequest.open(new AuthEmail(EMAIL), 'Jean');
        const r = requests(request);
        const a = allowList({ alreadyThere: true });
        const tx = new FakeTransactionRunner();

        await new ApproveAccessRequestHandler(r.repo, a.repo, tx).handle(new ApproveAccessRequestCommand(EMAIL));

        expect(request.getStatus()).toBe(AccessRequestStatus.APPROVED);
        expect(tx.committed).toBe(1);
    });

    it('abandonne tout si l’ouverture de la liste blanche échoue vraiment', async () => {
        const request = AccessRequest.open(new AuthEmail(EMAIL), 'Jean');
        const r = requests(request);
        const a = allowList({ failsWith: new Error('database unreachable') });
        const tx = new FakeTransactionRunner();

        await expect(
            new ApproveAccessRequestHandler(r.repo, a.repo, tx).handle(new ApproveAccessRequestCommand(EMAIL)),
        ).rejects.toThrow('database unreachable');

        expect(tx.rolledBack).toBe(1);
        expect(tx.committed).toBe(0);
    });

    it('rend une erreur 404 quand la demande n’existe pas', async () => {
        const r = requests(null);
        const a = allowList();
        const tx = new FakeTransactionRunner();

        await expect(
            new ApproveAccessRequestHandler(r.repo, a.repo, tx).handle(new ApproveAccessRequestCommand(EMAIL)),
        ).rejects.toThrow(NotFoundError);

        expect(tx.started).toBe(0);
    });

    it('normalise l’adresse reçue de l’URL', async () => {
        const request = AccessRequest.open(new AuthEmail(EMAIL), 'Jean');
        const r = requests(request);
        const a = allowList();
        const tx = new FakeTransactionRunner();

        await new ApproveAccessRequestHandler(r.repo, a.repo, tx).handle(
            new ApproveAccessRequestCommand('Visiteur@Example.COM'),
        );

        expect(a.added).toEqual([EMAIL]);
    });
});
