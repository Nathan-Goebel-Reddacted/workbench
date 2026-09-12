import { ContactMessage } from '../contactMessageAggregate';
import { ContactMessageId } from '../valueObject/contactMessageId';
import { SenderEmail } from '../valueObject/senderEmail';
import { answeredOnly, ContactField, SubmittedField } from '../valueObject/contactField';
import { EmptyContactMessageException } from '../exception/emptyContactMessage';

export class ContactMessageFactory {
    /**
     * Soumission d'un visiteur. Les champs laissés vides ne sont pas conservés, et un
     * formulaire entièrement vide est refusé — c'est un envoi accidentel ou un robot.
     */
    submit(id: string, fields: readonly SubmittedField[], submittedAt: Date = new Date()): ContactMessage {
        const answered = answeredOnly(fields);
        if (answered.length === 0) throw new EmptyContactMessageException();

        return new ContactMessage(new ContactMessageId(id), answered, selectSenderEmail(fields), submittedAt, false);
    }

    rehydrate(
        id: string,
        fields: ContactField[],
        senderEmail: string | null,
        submittedAt: Date,
        mailSent: boolean,
    ): ContactMessage {
        return new ContactMessage(
            new ContactMessageId(id),
            fields,
            senderEmail === null ? null : new SenderEmail(senderEmail),
            submittedAt,
            mailSent,
        );
    }
}

/**
 * L'adresse à laquelle répondre est celle du premier champ que l'éditeur a marqué comme
 * email et qui contient une adresse lisible.
 *
 * Elle est facultative : rien n'oblige un formulaire à demander une adresse, et une adresse
 * mal écrite ne doit pas faire perdre le message — elle prive seulement de la réponse.
 */
function selectSenderEmail(fields: readonly SubmittedField[]): SenderEmail | null {
    for (const field of fields ?? []) {
        if (field?.type !== 'email') continue;
        const candidate = SenderEmail.tryFrom(field.value);
        if (candidate) return candidate;
    }
    return null;
}
