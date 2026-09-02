import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ResolveReferenceQuery } from './resolveReferenceQuery';
import { ResolvedReferenceDto } from './resolvedReferenceDto';
import { IReferenceDirectory } from '../../../domain/iReferenceDirectory';
import { InvalidReferenceFormatException } from '../../../domain/exception/invalidReferenceFormat';
import { formatSegment, parseSegment } from '@shared/domain/valueObject/referenceSegment';
import { NotFoundError } from '@shared/application/errors/notFoundError';

/** `4`, `4.8` ou `4.8.23`. Les zéros de remplissage restent tolérés en entrée. */
const REFERENCE_FORMAT = /^\d{1,4}(\.\d{1,4}){0,2}$/;

export class ResolveReferenceHandler implements IQueryHandler<ResolveReferenceQuery, ResolvedReferenceDto> {
    constructor(private readonly directory: IReferenceDirectory) {}

    async handle(query: ResolveReferenceQuery): Promise<ResolvedReferenceDto> {
        const raw = query.reference.trim();
        // Une référence mal formée est une erreur de l'appelant (400), pas une absence (404).
        if (!REFERENCE_FORMAT.test(raw)) throw new InvalidReferenceFormatException();

        const segments = raw.split('.').map(parseSegment);
        const [ownerNumber, featureNumber, ticketNumber] = segments;

        const owner = await this.directory.findOwnerByNumber(ownerNumber);
        if (!owner) throw new NotFoundError('Owner', formatSegment(ownerNumber));

        const ownerDto = {
            type: owner.type,
            id: owner.id,
            number: owner.number,
            reference: formatSegment(owner.number),
            name: owner.name,
        };

        if (featureNumber === undefined) {
            return { kind: 'owner', owner: ownerDto, feature: null, ticket: null };
        }

        const features = await this.directory.listFeaturesOf(owner);
        const feature = features.find(f => f.number === featureNumber);
        if (!feature) throw new NotFoundError('Feature', raw);

        const featureDto = {
            id: feature.id,
            number: feature.number,
            reference: `${ownerDto.reference}.${formatSegment(feature.number)}`,
            name: feature.name,
        };

        if (ticketNumber === undefined) {
            return { kind: 'feature', owner: ownerDto, feature: featureDto, ticket: null };
        }

        const tickets = await this.directory.listTicketsOf(feature.id);
        const ticket = tickets.find(t => t.number === ticketNumber);
        if (!ticket) throw new NotFoundError('Ticket', raw);

        return {
            kind: 'ticket',
            owner: ownerDto,
            feature: featureDto,
            ticket: {
                id: ticket.id,
                number: ticket.number,
                reference: ticket.reference,
                title: ticket.title,
                status: ticket.status,
            },
        };
    }
}
