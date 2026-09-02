import { IMailer } from '../../domain/port/iMailer';
import { ConsoleMailer } from './consoleMailer';
import { readSmtpConfig, SmtpMailer } from './smtpMailer';
import { ILogger } from '@shared/application/port/iLogger';

/**
 * Picks the mailer from the environment. A missing SMTP configuration is not fatal: the app
 * falls back to printing the mails, and contact messages are persisted either way.
 */
export function createMailer(logger: ILogger, env: NodeJS.ProcessEnv = process.env): IMailer {
    const config = readSmtpConfig(env);
    if (!config) {
        logger.warn('SMTP_HOST / SMTP_USER / SMTP_PASS missing — mails are printed, not sent');
        return new ConsoleMailer();
    }
    return new SmtpMailer(config);
}
