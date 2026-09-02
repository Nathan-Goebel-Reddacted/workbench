import { FeatureRow, IReferenceDirectory, OwnerRow, TicketRow } from '../domain/iReferenceDirectory';
import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { IIdeaRepository } from '@contexts/idea/domain/repository/iIdeaRepository';
import { IFeatureRepository } from '@contexts/feature/domain/repository/iFeatureRepository';
import { ITicketRepository } from '@contexts/ticket/domain/repository/iTicketRepository';

/**
 * Le filtrage par numéro se fait en mémoire : l'atelier compte quelques dizaines de porteurs, et
 * ajouter un `findByNumber` à quatre repositories pour cela coûterait plus qu'il ne rapporte.
 * À revoir le jour où ces tables se comptent en milliers de lignes.
 */
export class ReferenceDirectory implements IReferenceDirectory {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly ideas: IIdeaRepository,
        private readonly features: IFeatureRepository,
        private readonly tickets: ITicketRepository,
    ) {}

    async listOwners(): Promise<OwnerRow[]> {
        const [projects, ideas] = await Promise.all([this.projects.findAll(), this.ideas.findAll()]);
        const rows: OwnerRow[] = [
            ...projects.map(p => ({
                type: 'project' as const,
                id: p.getId().getValue(),
                number: p.getNumber(),
                name: p.getName().getValue(),
            })),
            ...ideas.map(i => ({
                type: 'idea' as const,
                id: i.getId().getValue(),
                number: i.getNumber(),
                name: i.getName().getValue(),
            })),
        ];
        return rows.sort((a, b) => a.number - b.number);
    }

    async findOwnerByNumber(number: number): Promise<OwnerRow | null> {
        const owners = await this.listOwners();
        return owners.find(o => o.number === number) ?? null;
    }

    async listFeaturesOf(owner: OwnerRow): Promise<FeatureRow[]> {
        const features = await this.features.findByOwner(owner.type, owner.id);
        return features.map(f => ({
            id: f.getId().getValue(),
            number: f.getNumber(),
            name: f.getName().getValue(),
        }));
    }

    async listTicketsOf(featureId: string): Promise<TicketRow[]> {
        const tickets = await this.tickets.findByFeatureId(featureId);
        return tickets.map(t => ({
            id: t.getId().getValue(),
            number: t.getReference().getPosition(),
            reference: t.getReference().getValue(),
            title: t.getTitle().getValue(),
            status: t.getStatus(),
        }));
    }
}
