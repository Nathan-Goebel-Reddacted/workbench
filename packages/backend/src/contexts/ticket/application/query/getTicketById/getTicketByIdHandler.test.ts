import { describe, expect, it } from 'vitest';
import { GetTicketByIdHandler } from './getTicketByIdHandler.js';
import { GetTicketByIdQuery } from './getTicketByIdQuery.js';
import { TicketFactory } from '../../../domain/factory/ticketFactory.js';
import { TicketReference } from '../../../domain/valueObject/reference.js';
import type { ITicketRepository } from '../../../domain/repository/iTicketRepository.js';
import type { FeatureContext, IFeatureGateway } from '../../../domain/port/iFeatureGateway.js';
import type { Ticket } from '../../../domain/ticketAggregate.js';

function ticket(): Ticket {
    return new TicketFactory().create('t1', 'f1', new TicketReference('4.8.23'), 'Un ticket', 'À faire');
}

function repository(found: Ticket | null): ITicketRepository {
    return { findById: async () => found } as unknown as ITicketRepository;
}

const projectFeature: FeatureContext = { ownerType: 'project', ownerNumber: 4, featureNumber: 8 };

function features(visibleToAnonymous: boolean): IFeatureGateway {
    return {
        describe: async (_featureId: string, includeHidden: boolean = true) =>
            includeHidden || visibleToAnonymous ? projectFeature : null,
    };
}

describe('GetTicketByIdHandler', () => {
    it('rend le ticket à une session privée, même sous une feature masquée', async () => {
        const handler = new GetTicketByIdHandler(repository(ticket()), features(false));

        const result = await handler.handle(new GetTicketByIdQuery('t1', true));

        expect(result?.title).toBe('Un ticket');
    });

    it('masque le ticket à un anonyme quand sa feature ne lui est pas lisible', async () => {
        const handler = new GetTicketByIdHandler(repository(ticket()), features(false));

        const result = await handler.handle(new GetTicketByIdQuery('t1', false));

        expect(result).toBeNull();
    });

    it('rend le ticket à un anonyme quand sa feature lui est lisible', async () => {
        const handler = new GetTicketByIdHandler(repository(ticket()), features(true));

        const result = await handler.handle(new GetTicketByIdQuery('t1', false));

        expect(result?.reference).toBe('4.8.23');
    });

    it('inclut la feature masquée par défaut, ce dont dépendent les appels internes', async () => {
        const handler = new GetTicketByIdHandler(repository(ticket()), features(false));

        const result = await handler.handle(new GetTicketByIdQuery('t1'));

        expect(result).not.toBeNull();
    });

    it('rend null quand le ticket n’existe pas', async () => {
        const handler = new GetTicketByIdHandler(repository(null), features(true));

        const result = await handler.handle(new GetTicketByIdQuery('t1', true));

        expect(result).toBeNull();
    });
});
