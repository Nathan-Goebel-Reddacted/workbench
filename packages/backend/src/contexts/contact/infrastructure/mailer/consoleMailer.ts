import { IMailer, MailMessage } from '../../domain/port/iMailer';

/** Development stand-in: prints the mail instead of sending it, so no SMTP account is needed. */
export class ConsoleMailer implements IMailer {
    async send(message: MailMessage): Promise<void> {
        console.info(
            `[mail] to=${message.to} replyTo=${message.replyTo ?? '-'}\n` +
                `[mail] subject=${message.subject}\n${message.text}`,
        );
    }
}
