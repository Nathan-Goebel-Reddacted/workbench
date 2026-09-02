import { CommandBus } from '@shared/application/command/commandBus';
import { IProjectCreationGateway, ProjectDraft } from '../../domain/port/iProjectCreationGateway';
import { CreateProjectCommand } from '@contexts/project/application/command/createProject/createProjectCommand';

/**
 * Passe par la commande publique du ProjectCatalog plutôt que par son repository : c'est lui qui
 * décide comment un projet se construit. Seuls le numéro et la visibilité sont imposés — le
 * premier parce qu'il vient de l'idée, la seconde parce qu'une idée convertie n'est pas publiée.
 */
export class ProjectCreationGateway implements IProjectCreationGateway {
    constructor(private readonly commandBus: CommandBus) {}

    async create(draft: ProjectDraft): Promise<void> {
        await this.commandBus.dispatch(
            new CreateProjectCommand(
                draft.id,
                draft.name,
                draft.description,
                [...draft.links],
                [...draft.documents],
                draft.category,
                draft.number,
                false,
            ),
        );
    }
}
