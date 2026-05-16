# Operations runbook

Things you do every day or every week to keep Mindset running smoothly.
Lives here rather than known-bugs.md because these are intentional workflows,
not bugs.

---

## Session Meet links

Meet links are **not** auto-generated. After a user pays:

1. Session goes to `CONFIRMED` (via Razorpay webhook updating Session.status)
2. **User** gets a *"session confirmed"* email — explicitly says the therapist
   will add the link; no Join button yet on their dashboard
3. **Doctor** gets a *"new booking — please add a Meet link"* email with a
   one-click **[Add Meet link]** button → `/doctor/calendar?highlight={sessionId}`
4. Doctor pastes the link via `/doctor/calendar` (highlighted session card
   auto-opens for paste)
5. User sees the Join button on `/user/sessions/{id}` and in the dashboard
   rail starting 15 minutes before the session

### Doctor workflow (~30 seconds per booking)

1. Receive "New session booking" email
2. Click **[Add Meet link]** → lands on `/doctor/calendar` with the session
   already selected and the link editor open
3. In a separate tab: open https://meet.google.com → **New meeting** →
   **Create for later** → **Copy URL**
4. Paste into the input → **Save**
5. Done. Toast confirms: "Link added. The user can now see it on their dashboard."

The system also accepts **Zoom** (`https://zoom.us/...`) and **Whereby**
(`https://whereby.com/...`) links if a doctor prefers their existing
workflow.

### Admin oversight

`/admin/sessions` shows a **"Confirmed sessions need a Meet link"** card at
the top of the page when any pending sessions exist. The card lists each
pending session sorted by date-ascending (soonest first) with patient name,
doctor name, IST date+time, and a quick **Add link** button that opens the
inline editor for that row.

If a session is **< 30 minutes away** and still has no link:
- **First**: ping the doctor on WhatsApp/Slack
- **Second**: paste a Mindset house-account Meet link via /admin/sessions
- **Third (worst case)**: if no link can be provisioned in time, mark the
  session `CANCELLED` and trigger a refund — better than a no-show

### Why not auto-generate Meet links?

Google service accounts **cannot** create Meet conferences (anti-abuse
policy). The original `src/lib/google-calendar.ts` integration tried to use
a service account with `calendarId: 'primary'` + `hangoutsMeet` conference
solution; this silently failed on every booking, leaving `Session.meetLink`
null indefinitely.

The two paths to auto-generation are both heavier than manual paste at our
current volume:

1. **Domain-Wide Delegation (DWD)**: configure the service account in
   Google Workspace admin to impersonate a real Workspace user. Requires a
   Workspace tenant + admin access + JSON key rotation policy.
2. **OAuth2 with a refresh token from a single Mindset admin account**:
   no Workspace requirement, but introduces single-point-of-failure (if
   that account's token is revoked, all bookings break) and a token-refresh
   cron.

Revisit auto-generation when:
- Doctor count > 10 (manual paste becomes a coordination problem), OR
- Booking volume > 50/week (paste latency creates user friction)

Until then: the manual workflow is intentional and reliable.

`src/lib/google-calendar.ts` is **retained** for the eventual switch — it
still has `createMeetLinkForSession`, `cancelCalendarEvent`,
`updateCalendarEvent`. The webhook call to `createMeetLinkForSession`
was removed in commit `20c1ab3`.

---

## Email sending

All transactional emails go through Resend. The send code lives in
`src/lib/email-service.ts`. The `from` address is a single constant
`FROM_EMAIL` in `src/lib/email-config.ts` — currently sources from
`process.env.RESEND_FROM_EMAIL` with a verified-domain fallback.

### Verified senders

The `hello@mindset.org.in` domain is verified in Resend. Use:
- `Mindset <hello@mindset.org.in>` as the `from` value in `RESEND_FROM_EMAIL`

**Never** use `onboarding@resend.dev` in production — it's Resend's
test-only sender that only delivers to the Resend account owner, and
returns 403 for anyone else. That's what caused the case 1 smoke
"no booking email" bug pre-A1.

### Templates

All templates in `src/emails/`. They share the `EmailLayout` wrapper
(`src/emails/components/email-layout.tsx`) which renders the footer with
`SUPPORT_EMAIL` (`hello@mindset.org.in`).

### Diagnosing missing emails

If a user reports not receiving an email:

1. **Resend dashboard** → Emails → filter by recipient. If the row exists
   with status **Delivered** → check spam folder.
2. If the row exists with status **Bounced** or **Failed** → invalid
   address or sender domain config issue.
3. If no row exists at all → the send was never attempted. Check Vercel
   function logs for the relevant route (`[WEBHOOK]`, `[EMAIL]`, or
   the specific tag like `session-booking-confirmation`).

Logs include sender → masked recipient → tag on success/failure for each
attempt, e.g.:
```
[EMAIL] ✓ session-booking-confirmation sent to c***@gmail.com
[EMAIL] ✗ doctor-new-booking failed for d***@mindset.org.in: <error>
```
