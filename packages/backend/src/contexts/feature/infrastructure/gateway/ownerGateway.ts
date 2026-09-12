import { IOwnerGateway } from '../../domain/port/iOwnerGateway';
import { FeatureOwner } from '../../domain/valueObject/featureOwner';
import { IProjectRepository } from '@contexts/project/domain/repository/iProjectRepository';
import { IIdeaRepository } from '@contexts/idea/domain/repository/iIdeaRepository';
import { IdeaId } from '@contexts/idea/domain/valueObject/ideaId';
import { ProjectId } from '@contexts/project/domain/valueObject/projectId';

/**
 * Unique endroit où le contexte Feature touche à ses voisins — l'équivalent d'une couche
 * anticorruption. Le reste du contexte ne connaît que `IOwnerGateway` : ajouter un troisième type
 * de porteur se fait ici, et nulle part ailleurs.
 */
export class OwnerGateway implements IOwnerGateway {
    constructor(
        private readonly projects: IProjectRepository,
        private readonly ideas: IIdeaRepository,
    ) {}

    async exists(owner: FeatureOwner): Promise<boolean> {
        return (await this.numberOf(owner)) !== null;
    }

    async numberOf(owner: FeatureOwner): Promise<number | null> {
        if (owner.isIdea()) {
            const idea = await this.ideas.findById(new IdeaId(owner.getId()));
            return idea ? idea.getNumber() : null;
        }
        const project = await this.projects.findById(new ProjectId(owner.getId()));
        return project ? project.getNumber() : null;
    }
}
