# Local Webhook Setup for Razorpay

Razorpay's servers send webhook events (`payment.captured`, `payment.failed`) to a
public URL. When running locally, `localhost:3000` is not reachable by Razorpay,
so webhooks never fire and Payment rows stay in `PENDING` state.

The `POST /api/payments/verify` endpoint (added in Sprint 11g) fixes this for the
normal purchase flow by verifying payment from the client side immediately after the
Razorpay handler fires. But for edge cases (`payment.failed`, retries, debugging the
webhook path itself), you need a tunnel.

## Setup with ngrok

### Install ngrok

```bash
# macOS
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### Run the tunnel

```bash
# Start your dev server first
npm run dev

# In a separate terminal
ngrok http 3000
```

ngrok prints a public URL like `https://abc123.ngrok-free.app`. Copy it.

### Configure Razorpay test mode webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks
2. Click **Add New Webhook**
3. **URL:** `https://abc123.ngrok-free.app/api/payments/webhook`
4. **Secret:** generate one — `openssl rand -hex 32`
5. **Events:** check `payment.captured` and `payment.failed`
6. Save

### Add the secret to your local env

```bash
# .env.local
RAZORPAY_WEBHOOK_SECRET=<the secret you just set in the Razorpay dashboard>
```

Restart the dev server after adding the env var (`Ctrl-C` then `npm run dev`).

### Verify it works

1. Open `http://localhost:4040` (ngrok's inspect UI) in a browser
2. Place a test order through the dashboard
3. Complete payment with test card `4718 6000 0000 0002` (Indian Visa, CVV 123)
4. Watch the ngrok inspect UI — you should see a `POST /api/payments/webhook` request
5. Response should be `200`

The dev server console will log `[WEBHOOK] ✓ Transaction complete` when the webhook
fires and is processed correctly.

## Test cards that work with INR (no "international not allowed" error)

| Network | Number | CVV | Expiry |
|---------|--------|-----|--------|
| Visa | `4718 6000 0000 0002` | 123 | Any future |
| Mastercard | `5267 3181 8797 5449` | 123 | Any future |
| Rupay | `6073 8492 8700 0001` | 123 | Any future |

Cards like `4111 1111 1111 1111` are classified as international by Razorpay's BIN
database and will be rejected when international payments are disabled on the account
(which is correct for an INR-only business).

## Production checklist (for Suryansh — manual steps)

These need to be done in the Razorpay **live mode** dashboard and in the production
deployment. Claude Code cannot do these.

- [ ] Go to Razorpay Dashboard → switch to **Live Mode** → Settings → Webhooks
- [ ] Add webhook URL: `https://www.mindset.org.in/api/payments/webhook`
      (replace with your actual production domain if different)
- [ ] Events: `payment.captured`, `payment.failed`
- [ ] Copy the webhook secret Razorpay generates
- [ ] Set `RAZORPAY_WEBHOOK_SECRET=<secret>` in Vercel (or your host) environment
      variables for the production deployment
- [ ] Deploy and place a real ₹1 test order to verify the webhook fires

## Why not rely on the webhook alone?

The `POST /api/payments/verify` endpoint marks Payment `PAID` immediately after the
user's browser receives the Razorpay success callback. This makes entitlement work
instantly without a webhook round-trip.

The webhook remains useful as a safety net for:
- Users who close the browser before the verify call completes
- `payment.failed` events to restore stock on failed product orders
- Any future payment types that need server-side post-payment logic
