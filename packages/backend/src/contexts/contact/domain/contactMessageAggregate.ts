/** One answered field of the form, as it was labelled on the page the visitor filled in. */
export type ContactField = Readonly<{ label: string; value: string }>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
    return EMAIL_PATTERN.test(value);
}

export class ContactMessageError extends Error {}

/**
 * A message submitted through a contact form widget. The form's shape is decided in the editor,
 * so the aggregate stores answers as labelled pairs rather than named columns.
 */
export class ContactMessage {
    private constructor(
        private readonly id: string,
        private readonly fields: ContactField[],
        private readonly senderEmail: string | null,
        private readonly submittedAt: Date,
        private mailSent: boolean,
    ) {}

    /** Rebuilds an existing message (persistence side). No validation: it was validated once. */
    static rehydrate(
        id: string,
        fields: ContactField[],
        senderEmail: string | null,
        submittedAt: Date,
        mailSent: boolean,
    ): ContactMessage {
        return new ContactMessage(id, fields, senderEmail, submittedAt, mailSent);
    }

    /** Creates a message from a visitor's submission, rejecting anything empty or malformed. */
    static submit(id: string, fields: ContactField[], senderEmail: string | null, submittedAt: Date): ContactMessage {
        const answered = fields.filter(field => field.value.trim() !== '');
        if (answered.length === 0) {
            throw new ContactMessageError('A contact message cannot be empty');
        }
        if (senderEmail !== null && !isValidEmail(senderEmail)) {
            throw new ContactMessageError('The sender email is not a valid address');
        }
        return new ContactMessage(id, answered, senderEmail, submittedAt, false);
    }

    getId(): string {
        return this.id;
    }

    getFields(): ContactField[] {
        return [...this.fields];
    }

    getSenderEmail(): string | null {
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

    /** Plain-text body of the notification mail: one labelled line per answered field. */
    toMailBody(): string {
        return this.fields.map(field => `${field.label} : ${field.value}`).join('\n\n');
    }
}
