import { ContactMessageId } from './valueObject/contactMessageId';
import { SenderEmail } from './valueObject/senderEmail';
import { ContactField } from './valueObject/contactField';

export type { ContactField };

/**
 * Un message envoyé par le formulaire de contact. La forme du formulaire est décidée dans
 * l'éditeur, donc le message garde des paires intitulé/valeur plutôt que des colonnes nommées.
 */
export class ContactMessage {
    constructor(
        private readonly id: ContactMessageId,
        private readonly fields: ContactField[],
        private readonly senderEmail: SenderEmail | null,
        private readonly submittedAt: Date,
        private mailSent: boolean,
    ) {}

    getId(): ContactMessageId {
        return this.id;
    }

    getFields(): ContactField[] {
        return [...this.fields];
    }

    getSenderEmail(): SenderEmail | null {
        return this.senderEmail;
    }

    getSubmittedAt(): Date {
        return this.submittedAt;
    }

    isMailSent(): boolean {
        return this.mailSent;
    }

    markMailSent(): void {
        this.mailSent = true;
    }

    /** Corps du mail de notification : une ligne par champ rempli, avec son intitulé. */
    toMailBody(): string {
        return this.fields.map(field => `${field.label} : ${field.value}`).join('\n\n');
    }
}
