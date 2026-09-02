export type MailMessage = {
    to: string;
    subject: string;
    text: string;
    /**
     * The visitor's address goes here, never in `from`: the sending mailbox must stay the one
     * we are actually authenticated on, otherwise the provider rejects the mail or spams it.
     */
    replyTo?: string;
};

export interface IMailer {
    send(message: MailMessage): Promise<void>;
}
