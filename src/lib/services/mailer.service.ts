import { createTransport, Transporter } from 'nodemailer'

import Mail from 'nodemailer/lib/mailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

import { APP_NAME } from '../misc/constants'

const {
    EMAIL_SERVICE: emailService,
    MAILER_EMAIL: transporterEmail,
    MAILER_PASSWORD: transporterPassword
} = process.env

export class MailerService {
    private transporter: Transporter<SMTPTransport.SentMessageInfo>

    constructor() {
        const transporter = createTransport({
            service: emailService,

            host: 'smtp.gmail.com',
            port: 465,
            secure: true,

            auth: {
                user: transporterEmail,
                pass: transporterPassword
            }
        })

        this.transporter = transporter
    }

    /**
     * Sends an email to a specified mailbox.
     * @param receiverEmail Email to send the message to.
     * @param content Message content object.
     */
    public async send(
        receiverEmail: string,
        content: Required<Pick<Mail.Options, 'subject' | 'text' | 'html'>>
    ): Promise<SMTPTransport.SentMessageInfo> {
        return this.transporter.sendMail({
            from: `${APP_NAME} <${transporterEmail}>`,
            to: receiverEmail,
            ...content
        })
    }
}


declare global {

    // eslint-disable-next-line
    namespace NodeJS {

        // eslint-disable-next-line
        interface ProcessEnv extends Record<
            'MONGODB_URI' | 'PAYLOAD_SECRET' |
            'EMAIL_SERVICE' | 'MAILER_EMAIL' |
            'MAILER_PASSWORD', string
        > { }
    }
}
