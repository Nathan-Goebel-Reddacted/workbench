import { Command } from '@shared/application/command/command';
import { SubmittedField } from '@contexts/contact/domain/valueObject/contactField';

/**
 * Les champs arrivent bruts, avec le type que l'éditeur leur a donné. C'est le domaine qui
 * décide lequel porte l'adresse de réponse : la route n'a pas à connaître cette règle.
 */
export class SubmitContactMessageCommand implements Command {
    static readonly commandName = 'contact.SubmitContactMessage';
    readonly commandName = SubmitContactMessageCommand.commandName;

    constructor(
        readonly id: string,
        readonly fields: SubmittedField[],
    ) {}
}
