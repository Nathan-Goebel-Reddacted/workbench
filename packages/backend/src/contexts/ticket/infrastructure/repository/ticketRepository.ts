import { EntityManager } from '@mikro-orm/postgresql';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { ITicketRepository } from '../../domain/repository/iTicketRepository';
import { Ticket } from '../../domain/ticketAggregate';
import { TicketOrmEntity } from '../entity/ticketOrmEntity';
import { TicketId } from '../../domain/valueObject/ticketId';
import { TicketReference } from '../../domain/valueObject/reference';
import { FeatureId } from '../../domain/valueObject/featureId';
import { Title } from '../../domain/valueObject/title';
import { Description } from '../../domain/valueObject/description';
import { TicketStatus } from '../../domain/valueObject/status';
import { Note } from '../../domain/valueObject/note';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';
import { DuplicateReferenceException } from '../../domain/exception/duplicateReferenceException';

export class TicketRepository implements ITicketRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<Ticket | null> {
        const e = await this.em.findOne(TicketOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByFeatureId(featureId: string): Promise<Ticket[]> {
        const entities = await this.em.find(TicketOrmEntity, { featureId }, { orderBy: { number: 'asc' } });
        return entities.map(e => this.toDomain(e));
    }

    async findByFeatureIds(featureIds: string[]): Promise<Ticket[]> {
        if (featureIds.length === 0) return [];
        const entities = await this.em.find(
            TicketOrmEntity,
            { featureId: { $in: featureIds } },
            { orderBy: { number: 'asc' } },
        );
        return entities.map(e => this.toDomain(e));
    }

    async countByFeatureId(featureId: string): Promise<number> {
        return this.em.count(TicketOrmEntity, { featureId });
    }

    async lastNumberOf(featureId: string): Promise<number> {
        // Le plus grand numéro, pas le nombre de tickets : une suppression ne doit pas réattribuer
        // un numéro déjà porté par un ticket cité ailleurs.
        const [row] = await this.em
            .getConnection()
            .execute<
                Array<{ max: number | null }>
            >('select max("number") as max from tickets where feature_id = ?', [featureId]);
        return row?.max ?? 0;
    }

    async existsByReference(reference: string): Promise<boolean> {
        return (await this.em.count(TicketOrmEntity, { reference })) > 0;
    }

    async deleteByFeatureId(featureId: string): Promise<void> {
        await this.em.transactional(async em => {
            await em.nativeDelete(TicketOrmEntity, { featureId });
        });
    }

    async delete(id: string): Promise<void> {
        await this.em.transactional(async em => {
            await em.nativeDelete(TicketOrmEntity, { id });
        });
    }

    async save(ticket: Ticket): Promise<void> {
        try {
            await this.em.transactional(async em => {
                // Trois cibles de conflit possibles (id, reference, feature+number) : on désigne
                // celle qui identifie réellement la ligne.
                await em.upsert(TicketOrmEntity, this.toOrm(ticket), { onConflictFields: ['id'] });
            });
        } catch (e) {
            if (e instanceof UniqueConstraintViolationException) {
                throw new DuplicateReferenceException();
            }
            throw e;
        }
    }

    private toDomain(e: TicketOrmEntity): Ticket {
        return new Ticket(
            new TicketId(e.id),
            new TicketReference(e.reference),
            new FeatureId(e.featureId),
            new Title(e.title),
            new Description(e.description),
            e.status as TicketStatus,
            e.notes.map(n => new Note(n)),
            e.documents.map(d => new Document(new DocumentId(d.id), d.name, d.url, d.type as DocumentType)),
        );
    }

    private toOrm(ticket: Ticket): TicketOrmEntity {
        const e = new TicketOrmEntity();
        e.id = ticket.getId().getValue();
        e.reference = ticket.getReference().getValue();
        e.featureId = ticket.getFeatureId().getValue();
        e.number = ticket.getReference().getPosition();
        e.title = ticket.getTitle().getValue();
        e.description = ticket.getDescription().getValue();
        e.status = ticket.getStatus();
        e.notes = ticket.getNotes().map(n => n.getValue());
        e.documents = ticket.getDocuments().map(d => ({
            id: d.getId().getValue(),
            name: d.getName(),
            url: d.getUrl(),
            type: d.getType(),
        }));
        return e;
    }
}
