import { createTransport, type Transporter } from 'nodemailer';
import { IMailer, MailMessage } from '../../domain/port/iMailer';

export type SmtpConfig = Readonly<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}>;

/**
 * Reads the SMTP settings from the environment, or returns null when they are incomplete —
 * a dev machine without credentials must still boot (see createMailer).
 */
export function readSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    const port = parseInt(SMTP_PORT ?? '587', 10);
    return {
        host: SMTP_HOST,
        port: Number.isFinite(port) ? port : 587,
        user: SMTP_USER,
        pass: SMTP_PASS,
        from: SMTP_FROM ?? SMTP_USER,
    };
}

export class SmtpMailer implements IMailer {
    private readonly transporter: Transporter;

    constructor(private readonly config: SmtpConfig) {
        this.transporter = createTransport({
            host: config.host,
            port: config.port,
            // 465 is implicit TLS; 587 starts plain and upgrades through STARTTLS.
            secure: config.port === 465,
            auth: { user: config.user, pass: config.pass },
        });
    }

    async send(message: MailMessage): Promise<void> {
        await this.transporter.sendMail({
            from: this.config.from,
            to: message.to,
            subject: message.subject,
            text: message.text,
            replyTo: message.replyTo,
        });
    }
}
