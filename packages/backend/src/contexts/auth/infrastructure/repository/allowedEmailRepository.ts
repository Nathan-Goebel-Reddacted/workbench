import { EntityManager } from '@mikro-orm/postgresql';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { AllowedEmailOrmEntity } from '../entity/allowedEmailOrmEntity';
import { IAllowedEmailRepository } from '../../domain/repository/iAllowedEmailRepository';
import { AuthEmail } from '../../domain/valueObject/email';
import { EmailAlreadyAllowedException } from '../../domain/exception/emailAlreadyAllowed';

export class AllowedEmailRepository implements IAllowedEmailRepository {
    constructor(private readonly em: EntityManager) {}

    async contains(email: AuthEmail): Promise<boolean> {
        return (await this.em.count(AllowedEmailOrmEntity, { email: email.getValue() })) > 0;
    }

    async findAll(): Promise<AuthEmail[]> {
        const rows = await this.em.findAll(AllowedEmailOrmEntity);
        return rows.map(row => new AuthEmail(row.email));
    }

    async add(email: AuthEmail): Promise<void> {
        const entity = this.em.create(AllowedEmailOrmEntity, { email: email.getValue(), createdAt: new Date() });
        try {
            await this.em.persistAndFlush(entity);
        } catch (error) {
            // L'entité refusée reste dans l'unité de travail et serait rejouée au flush
            // suivant, hors de ce try : le contexte doit l'oublier avant que l'exception
            // ne remonte.
            this.em.getUnitOfWork().unsetIdentity(entity);
            if (error instanceof UniqueConstraintViolationException) {
                throw new EmailAlreadyAllowedException(email.getValue());
            }
            throw error;
        }
    }

    async remove(email: AuthEmail): Promise<void> {
        await this.em.nativeDelete(AllowedEmailOrmEntity, { email: email.getValue() });
    }
}
