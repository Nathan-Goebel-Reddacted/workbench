import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ConvertIdeaToProjectCommand } from './convertIdeaToProjectCommand';
import { IIdeaRepository } from '../../../domain/repository/iIdeaRepository';
import { IIdeaFeaturesGateway } from '../../../domain/port/iIdeaFeaturesGateway';
import { IProjectCreationGateway } from '../../../domain/port/iProjectCreationGateway';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';
import { IdeaId } from '../../../domain/valueObject/ideaId';

/**
 * Convertit une idée en projet : l'idée est recopiée, ses features (et donc leurs tickets) sont
 * rattachées au projet, puis l'idée disparaît — c'est ce qui donne son sens à « convertie ».
 *
 * Le projet **reprend le numéro de l'idée**. Les deux partageant la même séquence, aucune
 * référence de ticket n'a besoin d'être réécrite : `4.8.23` reste `4.8.23`.
 *
 * Les trois écritures touchent trois dépôts : sans transaction, un incident au milieu laisse
 * soit une idée et un projet jumeaux, soit des features rattachées à un porteur disparu.
 */
export class ConvertIdeaToProjectHandler implements ICommandHandler<ConvertIdeaToProjectCommand> {
    constructor(
        private readonly repository: IIdeaRepository,
        private readonly features: IIdeaFeaturesGateway,
        private readonly projects: IProjectCreationGateway,
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: ConvertIdeaToProjectCommand): Promise<void> {
        const idea = await this.repository.findById(new IdeaId(command.ideaId));
        if (!idea) throw new NotFoundError('Idea', command.ideaId);

        await this.transaction.run(async () => {
            await this.projects.create({
                id: command.projectId,
                number: idea.getNumber(),
                name: idea.getName().getValue(),
                description: idea.getDescription().getValue(),
                category: command.category ?? idea.getCategory(),
                links: idea.getLinks().map(l => ({
                    url: l.getUrl(),
                    displayText: l.getDisplayText(),
                    logo: l.getLogo(),
                })),
                documents: idea.getDocuments().map(d => ({
                    id: d.getId().getValue(),
                    name: d.getName(),
                    url: d.getUrl(),
                    type: d.getType(),
                })),
            });

            // Les features changent de porteur AVANT que l'idée disparaisse : à l'instant de la
            // suppression, l'idée ne porte donc plus rien.
            await this.features.transferToProject(command.ideaId, command.projectId);

            // Suppression directe, sans passer par DeleteIdeaCommand : cette commande-là déclenche
            // la cascade, qui effacerait les features qu'on vient tout juste de transférer.
            await this.repository.delete(new IdeaId(command.ideaId));
        });
    }
}
