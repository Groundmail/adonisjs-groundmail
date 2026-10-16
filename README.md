<p align="center">
  <a href="https://groundmail.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://app.groundmail.dev/images/github/readme-logo-dark.png">
      <img alt="Groundmail" src="https://app.groundmail.dev/images/github/readme-logo-light.png" height="44">
    </picture>
  </a>
</p>

<h1 align="center">Groundmail for AdonisJS</h1>

<p align="center">
  An <a href="https://docs.adonisjs.com/guides/digging-deeper/mail">AdonisJS mail</a> transport for the Groundmail transactional email API.<br>
  Keep <code>mail.send()</code> and your mail classes; deliver through Groundmail.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/adonisjs-groundmail"><img alt="npm" src="https://img.shields.io/npm/v/adonisjs-groundmail?color=a3461f&label=npm"></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-b48f62"></a>
</p>

<p align="center">
  <a href="https://docs.groundmail.dev/frameworks/adonisjs">Docs</a> ·
  <a href="https://app.groundmail.dev/signup">Get a free account</a> ·
  <a href="https://groundmail.dev">groundmail.dev</a>
</p>

---

Works with `@adonisjs/mail` 9 (AdonisJS 6) and 10 (AdonisJS 7).

## Install

```bash
npm install adonisjs-groundmail
```

```bash
GROUNDMAIL_API_KEY=gm_your_key_here
```

## Configure

```ts
// config/mail.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/mail'
import { groundmailTransport } from 'adonisjs-groundmail'

const mailConfig = defineConfig({
  default: 'groundmail',
  mailers: {
    groundmail: groundmailTransport({
      apiKey: env.get('GROUNDMAIL_API_KEY'),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
```

Add `GROUNDMAIL_API_KEY: Env.schema.string()` to `start/env.ts`.

## Send

```ts
import mail from '@adonisjs/mail/services/main'

await mail.send((message) => {
  message
    .from('noreply@yourdomain.com')
    .to(user.email)
    .subject('Verify your email address')
    .htmlView('emails/verify_email', { user })
})
```

Attachments from `message.attach()`, `attachData()` and `embed()` are read and sent with the message. Queued mail (`mail.sendLater`) works the same way.

## Groundmail headers

```ts
message.header('X-Groundmail-Tag', 'flow=signup')
message.header('X-Groundmail-Idempotency-Key', `verify-${user.id}`)
```

| Header | Purpose |
|--------|---------|
| `X-Groundmail-Tag` | `name=value` tag (repeatable) |
| `X-Groundmail-Idempotency-Key` | Send once, even when your code retries |
| `X-Groundmail-Scheduled-At` | ISO 8601 time to send later |

## Contributing

Found a bug or want something added? [Open an issue](https://github.com/Groundmail/adonisjs-groundmail/issues). This code is published here on each release, so we port fixes rather than merging pull requests directly. The HTTP client itself is the [`groundmail`](https://www.npmjs.com/package/groundmail) package.

## Why Groundmail

- **Our own mail servers and IP space.** Your password resets and receipts don't share a pool with bulk marketing senders.
- **Transactional email only.** No newsletters or cold outreach on the platform, which keeps the sending reputation clean.
- **Start free.** 3,000 emails a month on the Free plan; Pro is 50,000 emails for $20/month. Dedicated IPs on Scale.
- **Built for code and for agents.** REST API, SMTP, SDKs for Node, Python, Go, PHP and Ruby, a CLI, and an MCP server for Claude, ChatGPT and Cursor.

## All Groundmail libraries

| Use | Package |
|-----|---------|
| Node.js / TypeScript | [`groundmail`](https://www.npmjs.com/package/groundmail) on npm |
| Python, Go, Ruby | [Groundmail/groundmail-sdks](https://github.com/Groundmail/groundmail-sdks) |
| PHP | [Groundmail/groundmail-php](https://github.com/Groundmail/groundmail-php) |
| Laravel | [Groundmail/groundmail-laravel](https://github.com/Groundmail/groundmail-laravel) |
| Symfony Mailer | [Groundmail/groundmail-symfony-mailer](https://github.com/Groundmail/groundmail-symfony-mailer) |
| Nodemailer | [Groundmail/groundmail-nodemailer](https://github.com/Groundmail/groundmail-nodemailer) |
| NestJS | [Groundmail/nestjs-groundmail](https://github.com/Groundmail/nestjs-groundmail) |
| Strapi | [Groundmail/strapi-provider-email-groundmail](https://github.com/Groundmail/strapi-provider-email-groundmail) |
| Medusa | [Groundmail/medusa-notification-groundmail](https://github.com/Groundmail/medusa-notification-groundmail) |
| AdonisJS | [Groundmail/adonisjs-groundmail](https://github.com/Groundmail/adonisjs-groundmail) |
| CLI | [`groundmail-cli`](https://www.npmjs.com/package/groundmail-cli) on npm |
| MCP server (Claude, ChatGPT, Cursor) | [Groundmail/groundmail-mcp](https://github.com/Groundmail/groundmail-mcp) |
| Agent skills and Claude Code plugin | [Groundmail/groundmail-skills](https://github.com/Groundmail/groundmail-skills) |

[Website](https://groundmail.dev) · [Docs](https://docs.groundmail.dev) · [Pricing](https://groundmail.dev/pricing) · [Sign up free](https://app.groundmail.dev/signup)
