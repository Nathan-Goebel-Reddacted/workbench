import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetReferenceTreeQuery } from './getReferenceTreeQuery';
import { IReferenceDirectory } from '../../../domain/port/iReferenceDirectory';
import { formatSegment } from '@shared/domain/valueObject/referenceSegment';

export type ReferenceTreeTicket = Readonly<{ id: string; reference: string; title: string; status: string }>;
export type ReferenceTreeFeature = Readonly<{
    id: string;
    reference: string;
    name: string;
    tickets: ReferenceTreeTicket[];
}>;
export type ReferenceTreeOwner = Readonly<{
    type: 'project' | 'idea';
    id: string;
    reference: string;
    name: string;
    features: ReferenceTreeFeature[];
}>;

/**
 * L'annuaire complet, porteurs compris sans feature et features sans ticket : une collection vide
 * est un état normal, pas une absence.
 */
export class GetReferenceTreeHandler implements IQueryHandler<GetReferenceTreeQuery, ReferenceTreeOwner[]> {
    constructor(private readonly directory: IReferenceDirectory) {}

    async handle(_query: GetReferenceTreeQuery): Promise<ReferenceTreeOwner[]> {
        const owners = await this.directory.listOwners();

        return Promise.all(
            owners.map(async owner => {
                const ownerRef = formatSegment(owner.number);
                const features = await this.directory.listFeaturesOf(owner);

                const withTickets = await Promise.all(
                    features.map(async feature => {
                        const featureRef = `${ownerRef}.${formatSegment(feature.number)}`;
                        const tickets = await this.directory.listTicketsOf(feature.id);
                        return {
                            id: feature.id,
                            reference: featureRef,
                            name: feature.name,
                            tickets: tickets.map(t => ({
                                id: t.id,
                                reference: t.reference,
                                title: t.title,
                                status: t.status,
                            })),
                        };
                    }),
                );

                return {
                    type: owner.type,
                    id: owner.id,
                    reference: ownerRef,
                    name: owner.name,
                    features: withTickets,
                };
            }),
        );
    }
}
