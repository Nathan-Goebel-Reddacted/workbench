import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SetDefaultThemeCommand } from './setDefaultThemeCommand';
import { IThemeRepository } from '../../../domain/repository/iThemeRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';

/**
 * Désigner le thème par défaut touche tous les thèmes : l'ancien cède le drapeau, le nouveau
 * le prend. Les deux écritures sont solidaires — à mi-chemin, le site public n'aurait plus
 * aucun défaut, ou deux.
 *
 * L'ordre compte : la contrainte unique en base est vérifiée à chaque instruction, pas à la
 * fin de la transaction. On retire donc avant d'attribuer.
 */
export class SetDefaultThemeHandler implements ICommandHandler<SetDefaultThemeCommand> {
    constructor(
        private readonly repository: IThemeRepository,
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: SetDefaultThemeCommand): Promise<void> {
        const themes = await this.repository.findAll();
        const target = themes.find(theme => theme.getId().getValue() === command.id);
        if (!target) throw new NotFoundError('Theme', command.id);
        if (target.isDefault()) return;

        // Tout se décide avant que quoi que ce soit ne soit écrit. Un thème masqué fait
        // échouer ici, alors qu'aucun autre agrégat n'a encore été touché : sans cela, les
        // anciens défauts resteraient en mémoire avec un drapeau qu'ils n'ont plus en base.
        target.markAsDefault();
        const superseded = themes.filter(theme => theme !== target && theme.isDefault());
        for (const theme of superseded) theme.unmarkAsDefault();

        await this.transaction.run(async () => {
            for (const theme of superseded) await this.repository.save(theme);
            await this.repository.save(target);
        });
    }
}
