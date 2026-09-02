import { Feature } from '../../domain/featureAggregate';
import { FeatureDto } from './getFeatureById/featureDto';
import { formatSegment } from '@shared/domain/valueObject/referenceSegment';

/**
 * Le numéro du porteur ne vit pas dans la feature : il est demandé au contexte qui le détient, puis
 * passé ici. Une seule fabrique de DTO pour les deux lectures, sinon les deux divergent.
 */
export function toFeatureDto(feature: Feature, ownerNumber: number | null): FeatureDto {
    return {
        id: feature.getId().getValue(),
        ownerType: feature.getOwner().getType(),
        ownerId: feature.getOwner().getId(),
        number: feature.getNumber(),
        reference: ownerNumber !== null ? `${formatSegment(ownerNumber)}.${formatSegment(feature.getNumber())}` : '',
        name: feature.getName().getValue(),
        description: feature.getDescription().getValue(),
        documents: feature.getDocuments().map(d => ({
            id: d.getId().getValue(),
            name: d.getName(),
            url: d.getUrl(),
            type: d.getType(),
        })),
    };
}
