import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { Document } from '@shared/domain/entity/document';
import {
    isImageDocument,
    isMindmapDocument,
    isPdfDocument,
    isVideoDocument,
} from '@shared/domain/valueObject/documentType';
import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { IFeatureRepository } from '@contexts/feature/domain/repository/iFeatureRepository';
import { ITicketRepository } from '@contexts/ticket/domain/repository/iTicketRepository';
import { MediaKind, ListMediaImagesQuery } from './listMediaImagesQuery';
import { FeatureImagesDto, MediaImageDto, ProjectImagesDto, TicketImagesDto } from './mediaImageDto';

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

// Lecture transverse : l'éditeur de contenu doit proposer les médias déjà attachés
// aux projets, features et tickets. La query porte le type de média voulu (image ou
// vidéo) ; seules les branches qui portent au moins un média de ce type sont
// retournées — un projet sans média nulle part n'apparaît pas.
export class ListMediaImagesHandler implements IQueryHandler<ListMediaImagesQuery, ProjectImagesDto[]> {
    constructor(
        private readonly projectRepository: IProjectRepository,
        private readonly featureRepository: IFeatureRepository,
        private readonly ticketRepository: ITicketRepository,
    ) {}

    async handle(query: ListMediaImagesQuery): Promise<ProjectImagesDto[]> {
        const matches = MEDIA_PREDICATES[query.kind];
        const projects = await this.projectRepository.findAll();

        const result = await Promise.all(
            projects.map(async project => {
                const projectId = project.getId().getValue();
                const features = await this.featureRepository.findByOwner('project', projectId);

                const featureDtos = await Promise.all(
                    features.map(async feature => {
                        const featureId = feature.getId().getValue();
                        const tickets = await this.ticketRepository.findByFeatureId(featureId);

                        const ticketDtos: TicketImagesDto[] = tickets
                            .map(ticket => ({
                                ticketId: ticket.getId().getValue(),
                                reference: ticket.getReference().getValue(),
                                title: ticket.getTitle().getValue(),
                                images: this.toMedia(matches, ticket.getDocuments()),
                            }))
                            .filter(t => t.images.length > 0);

                        const featureDto: FeatureImagesDto = {
                            featureId,
                            featureName: feature.getName().getValue(),
                            images: this.toMedia(matches, feature.getDocuments()),
                            tickets: ticketDtos,
                        };
                        return featureDto;
                    }),
                );

                const projectDto: ProjectImagesDto = {
                    projectId,
                    projectName: project.getName().getValue(),
                    images: this.toMedia(matches, project.getDocuments()),
                    features: featureDtos.filter(f => f.images.length > 0 || f.tickets.length > 0),
                };
                return projectDto;
            }),
        );

        return result.filter(p => p.images.length > 0 || p.features.length > 0);
    }

    private toMedia(matches: MediaPredicate, documents: Document[]): MediaImageDto[] {
        return documents
            .filter(d => matches(d.getType(), d.getUrl()))
            .map(d => ({
                id: d.getId().getValue(),
                name: d.getName(),
                url: d.getUrl(),
            }));
    }
}
