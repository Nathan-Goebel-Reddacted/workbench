import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { IFeatureRepository } from '@contexts/feature/domain/repository/iFeatureRepository';
import { ITicketRepository } from '@contexts/ticket/domain/repository/iTicketRepository';
import { FeatureOwner } from '@contexts/feature/domain/valueObject/featureOwner';
import { FeatureId } from '@contexts/ticket/domain/valueObject/featureId';
import { Document } from '@shared/domain/entity/document';
import {
    isImageDocument,
    isMindmapDocument,
    isPdfDocument,
    isVideoDocument,
} from '@shared/domain/valueObject/documentType';
import {
    FeatureMedia,
    IMediaLibrary,
    MediaItem,
    MediaKind,
    ProjectMedia,
    TicketMedia,
} from '../../domain/port/iMediaLibrary';

type MediaPredicate = (type: string, url: string) => boolean;

const MEDIA_PREDICATES: Record<MediaKind, MediaPredicate> = {
    image: isImageDocument,
    video: isVideoDocument,
    mindmap: isMindmapDocument,
    // Widget document et carrousel rendent tous deux les quatre formes.
    document: (type, url) =>
        isImageDocument(type, url) ||
        isVideoDocument(type, url) ||
        isMindmapDocument(type, url) ||
        isPdfDocument(type, url),
};

/**
 * Seul endroit où l'éditeur de contenu touche à ses voisins — l'équivalent d'une couche
 * anticorruption, comme `OwnerGateway` pour le contexte Feature.
 *
 * Trois requêtes, pas davantage : tous les projets, toutes leurs features, tous leurs
 * tickets. L'assemblage se fait ensuite en mémoire. La version précédente interrogeait la
 * base une fois par projet puis une fois par feature — sur trente projets de cinq features,
 * cela faisait près de deux cents allers-retours pour peupler un sélecteur de médias.
 */
export class MediaLibrary implements IMediaLibrary {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly features: IFeatureRepository,
        private readonly tickets: ITicketRepository,
    ) {}

    async browse(kind: MediaKind): Promise<ProjectMedia[]> {
        const matches = MEDIA_PREDICATES[kind];

        const projects = await this.projects.findAll();
        if (projects.length === 0) return [];

        const owners = projects.map(project => FeatureOwner.project(project.getId().getValue()));
        const features = await this.features.findByOwners(owners);

        const featureIds = features.map(feature => new FeatureId(feature.getId().getValue()));
        const tickets = await this.tickets.findByFeatureIds(featureIds);

        const ticketsByFeature = groupBy(tickets, ticket => ticket.getFeatureId().getValue());
        const featuresByProject = groupBy(features, feature => feature.getOwner().getId());

        return projects
            .map(project => {
                const projectId = project.getId().getValue();

                const featureMedia = (featuresByProject.get(projectId) ?? [])
                    .map((feature): FeatureMedia => {
                        const featureId = feature.getId().getValue();
                        const ticketMedia = (ticketsByFeature.get(featureId) ?? [])
                            .map(
                                (ticket): TicketMedia => ({
                                    ticketId: ticket.getId().getValue(),
                                    reference: ticket.getReference().getValue(),
                                    title: ticket.getTitle().getValue(),
                                    images: toMedia(matches, ticket.getDocuments()),
                                }),
                            )
                            .filter(ticket => ticket.images.length > 0);

                        return {
                            featureId,
                            featureName: feature.getName().getValue(),
                            images: toMedia(matches, feature.getDocuments()),
                            tickets: ticketMedia,
                        };
                    })
                    .filter(feature => feature.images.length > 0 || feature.tickets.length > 0);

                return {
                    projectId,
                    projectName: project.getName().getValue(),
                    images: toMedia(matches, project.getDocuments()),
                    features: featureMedia,
                };
            })
            .filter(project => project.images.length > 0 || project.features.length > 0);
    }
}

function toMedia(matches: MediaPredicate, documents: Document[]): MediaItem[] {
    return documents
        .filter(document => matches(document.getType(), document.getUrl()))
        .map(document => ({
            id: document.getId().getValue(),
            name: document.getName(),
            url: document.getUrl(),
        }));
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const id = key(item);
        const bucket = groups.get(id);
        if (bucket) bucket.push(item);
        else groups.set(id, [item]);
    }
    return groups;
}
