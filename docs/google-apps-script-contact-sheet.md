# Wiring the contact form to a Google Sheet

The `/api/contact` route saves every submission to the database. If you also
want submissions to show up in a Google Sheet (handy for non-technical staff),
follow these steps.

## 1. Create the destination sheet

1. Open Google Sheets and create a new spreadsheet titled e.g. `Mindset — Contact submissions`.
2. In row 1, paste this header:

```
Timestamp	Name	Email	Phone	Subject	Message	Age group	Support mode	First time	Heard from
```

## 2. Add an Apps Script Web App

1. In the same sheet, go to **Extensions → Apps Script**.
2. Replace the default `Code.gs` content with:

```javascript
const SHARED_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // Optional: simple shared-secret check. Add a `secret` field to the
    // payload from the Next.js route if you want to enforce this.
    // if (body.secret !== SHARED_SECRET) {
    //   return ContentService
    //     .createTextOutput(JSON.stringify({ error: 'unauthorized' }))
    //     .setMimeType(ContentService.MimeType.JSON);
    // }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      body.timestamp || new Date().toISOString(),
      body.name || '',
      body.email || '',
      body.phone || '',
      body.subject || '',
      body.message || '',
      body.ageGroup || '',
      body.supportMode || '',
      body.firstTime || '',
      body.heardFrom || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy → New deployment → Web app**.
4. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**, accept the OAuth prompt, and copy the **Web app URL**
   (it looks like `https://script.google.com/macros/s/AKfy.../exec`).

## 3. Add the URL to your env

In `.env.local` (and your production env on Vercel/wherever):

```
GOOGLE_APPS_SCRIPT_CONTACT_URL=https://script.google.com/macros/s/.../exec
```

Restart your dev server. From now on, every successful submission to
`/api/contact` will also append a row to the sheet. The sheet sync is
fire-and-forget — if Google is down, the user still gets a successful response
and the message is still saved to your database.

## 4. (Optional) Notify yourself when a row is added

In Apps Script, add a trigger:
**Triggers → Add Trigger → on form submit / on change → notify.**
Or use the `MailApp.sendEmail` API at the bottom of `doPost`.

## Re-deploy after editing

Each time you edit the Apps Script, you must run **Deploy → Manage deployments
→ Edit → New version → Deploy** for the change to take effect at the same URL.
