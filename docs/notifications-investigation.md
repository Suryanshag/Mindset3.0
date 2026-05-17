# Notifications — what's actually broken

Investigation done as Task 1 of Sprint UI-2a. No code changes here — diagnosis only. Fix lands in Task 2.

## Model + storage

`prisma.notification` model (`prisma/schema.prisma` line 492):

```
model Notification {
  id        String   @id @default(cuid())
  userId    String
  kind      NotificationKind   // SESSION_REMINDER, WORKSHOP, ORDER,
                               // REVIEW_PROMPT, SYSTEM, ASSIGNMENT_NEW,
                               // ASSIGNMENT_COMPLETED
  title     String
  body      String
  link      String?
  createdAt DateTime @default(now())
  readAt    DateTime?
  @@index([userId, readAt])
}
```

DB check (Neon production, against the engaged test user):
```
Total notifications:                    0
Notifications for engaged user:         0
```

Empty. None have ever been created in production.

## Notification creation sites (5 found)

| # | File | Triggered by | Target user |
|---|------|--------------|-------------|
| 1 | `src/lib/actions/sessions.ts:32` | User cancels their session | the **doctor** |
| 2 | `src/lib/actions/workshops.ts:64` | User registers for a free workshop | the **user** themselves |
| 3 | `src/lib/actions/assignments.ts:62` | User completes an assignment | the **doctor** |
| 4 | `src/lib/actions/journal.ts:176` | User completes a JOURNAL_PROMPT-type assignment | the **doctor** |
| 5 | `src/app/api/doctor/assignments/route.ts:90` | Doctor creates a new assignment | the **user** |

Out of 5 sites, **3 notify doctors and only 2 notify users** — and one of the user-facing ones (workshop registration) requires the seed/test path to actually call the action via the UI. Seed data inserted directly via `prisma.workshopRegistration.create` would bypass it.

The events users *would expect* to see in their bell — none of these create Notification rows today:

- Session **booked / paid** — `src/app/api/payments/webhook/route.ts` only sends an email.
- Session **24h reminder** — `src/app/api/cron/session-reminders/route.ts` only sends an email.
- Session **follow-up** (post-session) — same cron, only email.
- Order **placed / paid** — payments webhook, only email.
- Order **shipped / delivered** — `src/app/api/shiprocket/webhook/route.ts`, only emails.

## Cron jobs (1 found, scheduled by **nothing**)

`src/app/api/cron/session-reminders/route.ts` — a single GET handler that, on each invocation:

1. Sends session-reminder emails for sessions ~24h out (and marks `reminderSent=true`).
2. Sends follow-up emails for sessions that ended 2–26h ago (and marks `followupSent=true`).
3. Cleans up abandoned PENDING orders >24h old (restores stock, deletes payment + order).
4. Deletes expired/used password-reset tokens.

It does **not** create any `Notification` rows.

It's auth-gated by `Bearer ${CRON_SECRET}`, so it can only be invoked by Vercel cron or an authorized caller.

**No `vercel.json` exists in the repo.** That means Vercel Cron is not scheduled — the handler is sitting there waiting for a caller that never arrives. (Vercel cron requires a `vercel.json` `crons` array; without it Vercel won't invoke any cron endpoint.)

Net effect: even the email-only side of the system has been silent in production, not just notifications.

## /user/notifications page

`src/app/(dashboard)/user/notifications/page.tsx` is correct — it queries `prisma.notification.findMany({ where: { userId } })`, sorts desc, takes 50, hands to `<NotificationList>`. The empty state ("You're all caught up — No notifications yet") renders when the array is empty.

`<NotificationList>` (`src/components/dashboard/notification-list.tsx`) handles read-state, groups by Today/Yesterday/This week/Earlier, calls `markNotificationRead` / `markAllNotificationsRead` server actions which both exist and work.

The page and list **are not broken**. They have nothing to show because nothing puts rows in the table.

## Vercel cron logs

Can't directly inspect from this environment. But: with no `vercel.json` and no other scheduler, the cron has never run via a scheduler. There may be manual `curl` invocations (with `CRON_SECRET`) but none visible in the codebase or in DB side-effects (e.g. all `Session.reminderSent` would still be `false` for past confirmed sessions if the cron never ran — easy to verify after fix lands).

## Best diagnosis

Two compounded problems:

1. **No cron scheduler.** `vercel.json` is missing, so `/api/cron/session-reminders` never fires on a schedule. This silently kills reminder emails, follow-up emails, abandoned-order cleanup, and token cleanup. Nothing alerts on this because the cron handler just exists; no one's watching that it's invoked.

2. **Even if the cron ran, the notification bell would still be empty for the common events.** The cron + the payment/shiprocket webhooks all `sendEmail(...)` but never `prisma.notification.create(...)`. The 5 creation sites that do exist cover only: doctor-created assignments, user-registered free workshops, and a few doctor-facing notifications. Sessions getting booked/reminded, orders placed/shipped — never reach the bell.

### Fix scope for Task 2

Two parallel additions, minimal infra:

- **Add `vercel.json`** with a `crons` entry pointing at `/api/cron/session-reminders` on an hourly schedule (matches the 24h±1h reminder window the handler already uses).
- **Add `prisma.notification.create({ ... })` calls** alongside the existing email sends at:
  - `src/app/api/payments/webhook/route.ts` — when an ORDER payment lands (kind: `ORDER`, link: `/user/orders/<orderId>`) and when a SESSION payment lands (kind: `SESSION_REMINDER`, link: `/user/sessions/<sessionId>`).
  - `src/app/api/shiprocket/webhook/route.ts` — when a status transitions to SHIPPED or DELIVERED (kind: `ORDER`, link: `/user/orders/<orderId>`).
  - `src/app/api/cron/session-reminders/route.ts` — alongside the 24h email and the follow-up email (kind: `SESSION_REMINDER`).

After Task 2 lands, verify by booking a session or placing an order on the engaged test account and watching the bell light up.
