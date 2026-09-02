import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { SubmitContactMessageCommand } from './submitContactMessageCommand';
import { IContactMessageRepository } from '../../../domain/repository/iContactMessageRepository';
import { IMailer } from '../../../domain/port/iMailer';
import { ContactMessage } from '../../../domain/contactMessageAggregate';
import { ILogger } from '@shared/application/port/iLogger';

export class SubmitContactMessageHandler implements ICommandHandler<SubmitContactMessageCommand> {
    constructor(
        private readonly repository: IContactMessageRepository,
        private readonly mailer: IMailer,
        /** Owner's inbox, from CONTACT_MAIL_TO: never exposed to the public API. */
        private readonly recipient: string | null,
        private readonly logger: ILogger,
    ) {}

    async handle(command: SubmitContactMessageCommand): Promise<void> {
        const message = ContactMessage.submit(command.id, command.fields, command.senderEmail, new Date());

        // Persist first: a message that reached us is never lost to an SMTP outage.
        await this.repository.save(message);

        if (!this.recipient) {
            this.logger.warn('CONTACT_MAIL_TO is not set — message stored but not mailed', {
                messageId: command.id,
            });
            return;
        }

        try {
            await this.mailer.send({
                to: this.recipient,
                subject: 'Nouveau message depuis votre site',
                text: message.toMailBody(),
                replyTo: message.getSenderEmail() ?? undefined,
            });
            message.markMailSent();
            await this.repository.save(message);
        } catch (err) {
            // The visitor is not to blame for our mail server: the submission still succeeded.
            this.logger.error('Failed to send the contact notification mail', {
                messageId: command.id,
                err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
            });
        }
    }
}
