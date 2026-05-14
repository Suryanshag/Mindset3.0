#!/usr/bin/env node
// Direct Resend probe — sends a tiny email so we can read the API's verdict.
import { Resend } from 'resend'

const to = process.argv[2]
if (!to) {
  console.error('Usage: node tools/resend-probe.mjs <recipient@example.com>')
  process.exit(2)
}

const resend = new Resend(process.env.RESEND_API_KEY)
const from = process.env.RESEND_FROM_EMAIL ?? 'Mindset <onboarding@resend.dev>'

try {
  const res = await resend.emails.send({
    from,
    to,
    subject: 'Mindset Resend probe',
    html: '<p>This is a Resend probe sent at ' + new Date().toISOString() + '.</p>',
  })
  console.log('Resend response:', JSON.stringify(res, null, 2))
} catch (err) {
  console.error('Resend threw:', err)
}
