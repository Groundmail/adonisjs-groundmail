import { createTransport, type SendMailOptions, type Transport } from 'nodemailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message.js'
import { MailResponse } from '@adonisjs/mail'
import type { MailTransportContract, MailManagerTransportFactory, NodeMailerMessage } from '@adonisjs/mail/types'
import { createGroundmailTransport, type GroundmailTransportOptions } from 'groundmail-nodemailer'

export type GroundmailConfig = {
  /** Groundmail API key (`gm_…`). Falls back to `GROUNDMAIL_API_KEY`. */
  apiKey?: string
  /** Override the API base URL. */
  baseUrl?: string
  /** Prebuilt client (tests, shared clients). */
  client?: GroundmailTransportOptions['client']
}

export type GroundmailSentMessageInfo = {
  messageId: string
  envelope: { from: string | false; to: string[] }
  accepted: string[]
  response: string
}

/**
 * Nodemailer transport that reads every attachment into memory (paths, URLs
 * and streams, as AdonisJS `message.attach()` and `embed()` produce) before
 * handing the message to the Groundmail transport.
 */
function resolvingTransport(inner: Transport): Transport {
  return {
    name: inner.name,
    version: inner.version,
    send(mail: MailMessage, callback) {
      const attachments = mail.data.attachments ?? []
      Promise.all(
        attachments.map(async (attachment) => {
          if (Buffer.isBuffer(attachment.content) || typeof attachment.content === 'string') {
            if (!attachment.path && !attachment.href) return
          }
          const source = attachment.path
            ? { path: attachment.path }
            : attachment.href
              ? { href: attachment.href }
              : attachment.content
          attachment.content = (await mail.resolveContent({ content: source }, 'content')) as Buffer | string
          delete attachment.path
          delete attachment.href
        }),
      ).then(
        () => inner.send(mail, callback),
        (error: Error) => callback(error, undefined as never),
      )
    },
  }
}

/** AdonisJS mail transport that sends through the Groundmail HTTP API. */
export class GroundmailTransport implements MailTransportContract {
  constructor(private readonly config: GroundmailConfig = {}) {}

  async send(message: NodeMailerMessage, config?: GroundmailConfig): Promise<MailResponse<GroundmailSentMessageInfo>> {
    const options = { ...this.config, ...config }
    const apiKey = options.apiKey || process.env.GROUNDMAIL_API_KEY
    if (!options.client && !apiKey) {
      throw new Error('Groundmail API key is missing. Set apiKey in config/mail.ts or GROUNDMAIL_API_KEY.')
    }
    const transport = createTransport(
      resolvingTransport(createGroundmailTransport({ apiKey: apiKey ?? '', baseUrl: options.baseUrl, client: options.client })),
    )
    const info = (await transport.sendMail(message as SendMailOptions)) as GroundmailSentMessageInfo
    return new MailResponse(info.messageId, info.envelope, info)
  }
}

/**
 * Define a Groundmail mailer in `config/mail.ts`:
 *
 * ```ts
 * mailers: { groundmail: groundmailTransport({ apiKey: env.get('GROUNDMAIL_API_KEY') }) }
 * ```
 */
export function groundmailTransport(config: GroundmailConfig = {}): MailManagerTransportFactory {
  return () => new GroundmailTransport(config)
}
