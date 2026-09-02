import { EntityManager } from '@mikro-orm/postgresql';
import { AllowedEmailOrmEntity } from '../entity/allowedEmailOrmEntity';

export class EmailAlreadyAllowedException extends Error {
    constructor(email: string) {
        super(`Email already allowed: ${email}`);
    }
}

export class AllowedEmailRepository {
    constructor(private readonly em: EntityManager) {}

    async exists(email: string): Promise<boolean> {
        return (await this.em.count(AllowedEmailOrmEntity, { email })) > 0;
    }

    async findAll(): Promise<string[]> {
        const rows = await this.em.findAll(AllowedEmailOrmEntity);
        return rows.map(r => r.email);
    }

    async add(email: string): Promise<void> {
        if (await this.exists(email)) throw new EmailAlreadyAllowedException(email);

        const entity = this.em.create(AllowedEmailOrmEntity, { email, createdAt: new Date() });
        try {
            await this.em.persistAndFlush(entity);
        } catch (err: unknown) {
            // L'entité refusée reste dans l'unit of work et serait rejouée au flush suivant,
            // hors de ce try : le contexte doit l'oublier avant que l'exception ne remonte.
            this.em.getUnitOfWork().unsetIdentity(entity);
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('unique') || msg.includes('duplicate')) {
                throw new EmailAlreadyAllowedException(email);
            }
            throw err;
        }
    }

    async remove(email: string): Promise<void> {
        await this.em.nativeDelete(AllowedEmailOrmEntity, { email });
    }
}
