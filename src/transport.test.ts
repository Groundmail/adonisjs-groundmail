import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { Message } from '@adonisjs/mail'
import { Groundmail } from 'groundmail'
import { describe, expect, it, vi } from 'vitest'
import { GroundmailTransport, groundmailTransport } from './index.js'

function fakeClient() {
  const fetch = vi.fn(async () =>
    new Response(JSON.stringify({ id: 'em_123', status: 'queued' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
  const client = new Groundmail('gm_test_key', { baseUrl: 'https://api.test', fetch })
  const lastRequest = () => {
    const [url, init] = fetch.mock.calls.at(-1) as unknown as [string, RequestInit]
    return { url, headers: new Headers(init.headers), body: JSON.parse(String(init.body)) }
  }
  return { client, fetch, lastRequest }
}

describe('adonisjs-groundmail', () => {
  it('groundmailTransport returns a mailer factory', () => {
    const factory = groundmailTransport({ apiKey: 'gm_test_key' })
    expect(factory()).toBeInstanceOf(GroundmailTransport)
  })

  it('sends an AdonisJS message through the Groundmail API', async () => {
    const { client, lastRequest } = fakeClient()
    const message = new Message()
    message
      .from('noreply@acme.test', 'Acme')
      .to('user@example.com')
      .cc('cc@example.com')
      .replyTo('support@acme.test')
      .subject('Verify your email')
      .html('<p>Click the link</p>')
      .text('Click the link')
      .header('X-Groundmail-Tag', 'flow=signup')

    const response = await new GroundmailTransport({ client }).send(message.toJSON().message)

    expect(response.messageId).toBe('em_123')
    expect(response.envelope.to).toEqual(['user@example.com', 'cc@example.com'])
    const { url, headers, body } = lastRequest()
    expect(url).toBe('https://api.test/emails')
    expect(headers.get('authorization')).toBe('Bearer gm_test_key')
    expect(body).toMatchObject({
      from: 'Acme <noreply@acme.test>',
      to: 'user@example.com',
      cc: ['cc@example.com'],
      reply_to: 'support@acme.test',
      subject: 'Verify your email',
      html: '<p>Click the link</p>',
      text: 'Click the link',
      tags: [{ name: 'flow', value: 'signup' }],
    })
  })

  it('reads file, stream and inline attachments before sending', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gm-adonis-'))
    const file = join(dir, 'invoice.txt')
    writeFileSync(file, 'invoice body')

    const { client, lastRequest } = fakeClient()
    const message = new Message()
    message
      .from('billing@acme.test')
      .to('user@example.com')
      .subject('Invoice')
      .html('<img src="cid:logo">')
      .attach(file)
      .attachData(Readable.from([Buffer.from('streamed')]), { filename: 'stream.txt', contentType: 'text/plain' })
      .embedData(Buffer.from('png'), 'logo', { filename: 'logo.png', contentType: 'image/png' })

    await new GroundmailTransport({ client }).send(message.toJSON().message)

    const attachments = lastRequest().body.attachments as Array<Record<string, string>>
    expect(attachments).toHaveLength(3)
    expect(attachments[0]).toMatchObject({ name: 'invoice.txt', data: Buffer.from('invoice body').toString('base64') })
    expect(attachments[1]).toMatchObject({ name: 'stream.txt', data: Buffer.from('streamed').toString('base64') })
    expect(attachments[2]).toMatchObject({ name: 'logo.png', content_id: 'logo', data: Buffer.from('png').toString('base64') })
  })

  it('passes API errors to the caller', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Domain not verified' }), { status: 422 }))
    const client = new Groundmail('gm_test_key', { fetch })
    const message = new Message()
    message.from('a@acme.test').to('b@example.com').subject('Hi').text('Hi')
    await expect(new GroundmailTransport({ client }).send(message.toJSON().message)).rejects.toThrow(
      /Domain not verified/,
    )
  })

  it('needs an API key', async () => {
    const saved = process.env.GROUNDMAIL_API_KEY
    delete process.env.GROUNDMAIL_API_KEY
    try {
      const message = new Message()
      message.from('a@acme.test').to('b@example.com').subject('Hi').text('Hi')
      await expect(new GroundmailTransport().send(message.toJSON().message)).rejects.toThrow(/GROUNDMAIL_API_KEY/)
    } finally {
      if (saved !== undefined) process.env.GROUNDMAIL_API_KEY = saved
    }
  })
})
