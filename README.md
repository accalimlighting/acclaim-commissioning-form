# Acclaim Commissioning Form

Next.js app (app router + Tailwind) that renders the commissioning form and appends submissions to Google Sheets via a service account. Optimized for Vercel deployment.

## Prerequisites
- Node 18+ (matches Vercel runtime)
- Google Cloud project with Sheets API enabled
- A Google Sheet to store responses

## Environment variables
Create `.env.local` (or set in Vercel project settings):
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_ID=your-google-sheet-id
```
Optional (recommended in production):
```
ADMIN_SECRET=your-secret-for-admin-api
```
Notes:
- Preserve newline escapes (`\n`) in the private key when pasting into env vars.
- Share the target Sheet with the service account email with Editor access.
- The API writes to `Sheet1!A1`; rename `Sheet1` if you prefer but keep the range in `app/api/submit/route.ts` in sync.
- **Admin:** When `ADMIN_SECRET` is set, `GET /api/submissions` and `PATCH /api/submissions/[id]` require the header `x-admin-key: <ADMIN_SECRET>`. Use the admin UI at `/admin?key=<ADMIN_SECRET>` so the key is sent with each request.

## Local development
```bash
npm install
npm run dev
# visit http://localhost:3000
```

## Admin review and closeout
- Open **/admin** to list submissions, filter by status (new / reviewed / closed), and open details.
- Use "Mark reviewed" and "Mark closed" to update status; optional "Reviewed by" and "Internal notes" are stored in the sheet.
- If `ADMIN_SECRET` is set, use **/admin?key=YOUR_ADMIN_SECRET** so the app can call the admin API.

## Deploy to Vercel
1. Push the repo or import into Vercel.
2. Add the environment variables above (and `ADMIN_SECRET` for production) in Vercel Project Settings → Environment Variables.
3. Deploy. Vercel will host the static form and the API routes that read/write Sheets.

## Google Sheet setup

Follow these steps so the app can read and write submissions.

### 1. Create or open the spreadsheet

- Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet, or open an existing one.
- Ensure the first sheet tab is named **Sheet1** (the default). If you renamed it, either rename it back to `Sheet1` or update the range in the code (e.g. in `app/api/submit/route.ts` and `app/api/submissions/route.ts`) to use your tab name.

### 2. Add the header row

- In **row 1**, enter these column headers **in order**, one per cell (A1, B1, C1, … through U1):

  | A              | B         | C         | D             | E              | F               | G              | H             | I                        | J                   | K            | L                      | M                | N      | O            | P           | Q         | R              | S              | T            | U            |
  |----------------|-----------|-----------|---------------|----------------|-----------------|----------------|---------------|---------------------------|---------------------|--------------|-------------------------|------------------|--------|--------------|-------------|-----------|----------------|----------------|--------------|--------------|
  | Submission ID  | Timestamp | Job name  | Site address  | Contact name   | Contact email   | Contact phone  | Drawing link  | Programming narrative     | Fixtures operable   | Wiring notes | DMX access available    | Additional notes | Status | Reviewed By  | Reviewed At | Closed At | Internal Notes | Purchase Order | Scheduled On | Completed On |

- Or type each header in order: **A1** = Submission ID, **B1** = Timestamp, **C1** = Job name, **D1** = Site address, **E1** = Contact name, **F1** = Contact email, **G1** = Contact phone, **H1** = Drawing link, **I1** = Programming narrative, **J1** = Fixtures operable, **K1** = Wiring notes, **L1** = DMX access available, **M1** = Additional notes, **N1** = Status, **O1** = Reviewed By, **P1** = Reviewed At, **Q1** = Closed At, **R1** = Internal Notes, **S1** = Purchase Order, **T1** = Scheduled On, **U1** = Completed On.

- Leave **row 2 and below** empty for the app to append new submissions.

### 3. Get the Sheet ID

- Look at the URL of your spreadsheet:
  - Format: `https://docs.google.com/spreadsheets/d/**SHEET_ID**/edit...`
- Copy the long string between `/d/` and `/edit`. That is your **GOOGLE_SHEETS_ID** for `.env.local` and Vercel.

### 4. Share with the service account

- In the sheet, click **Share**.
- Add the **service account email** (same as `GOOGLE_SERVICE_ACCOUNT_EMAIL` in your env) as a user.
- Give it **Editor** access so the app can append and update rows.
- Save. The app can now write new submissions and the admin can update status.

### 5. (Optional) You already have data in the old 12-column layout

- Add 9 new columns to the **right** of your existing columns: **Submission ID**, **Status**, **Reviewed By**, **Reviewed At**, **Closed At**, **Internal Notes**, **Purchase Order**, **Scheduled On**, **Completed On**.
- Optionally add the header row as in step 2 if you don’t have one. Existing data rows can stay as-is; the app will treat them as `status: new` and assign synthetic IDs when you use the admin panel.

---

## Sheet schema (column order)

Row 1 must be headers. Data starts at row 2. The app expects **Sheet1** with these columns in order:

| # | Column           | Description                          |
|---|------------------|--------------------------------------|
| 1 | Submission ID    | UUID for each submission             |
| 2 | Timestamp        | ISO timestamp when submitted         |
| 3 | Job name         |                                      |
| 4 | Site address     |                                      |
| 5 | Contact name     | Field contact                        |
| 6 | Contact email    |                                      |
| 7 | Contact phone    |                                      |
| 8 | Drawing link     |                                      |
| 9 | Programming narrative |                              |
| 10| Fixtures operable| Yes/No                               |
| 11| Wiring notes     |                                      |
| 12| DMX access available | Yes/No                            |
| 13| Additional notes |                                      |
| 14| Status           | `new` \| `reviewed` \| `closed`      |
| 15| Reviewed By      | Set when marking reviewed            |
| 16| Reviewed At      | ISO timestamp                        |
| 17| Closed At        | ISO timestamp                        |
| 18| Internal Notes   | Admin-only notes                     |
| 19| Purchase Order   | Required PO number                   |
| 20| Scheduled On     | Optional scheduled date/time         |
| 21| Completed On     | Optional completed date/time         |

**Migration from old layout:** If you already have data without Submission ID / Status columns, add the new columns (Submission ID, then Status, Reviewed By, Reviewed At, Closed At, Internal Notes, Purchase Order, Scheduled On, Completed On) to the right of "Additional notes". Existing rows will be read with `status: new` and a synthetic ID; new submissions will fill all columns.

## Validation and rate limiting
- **Submit payload:** Required and optional fields are validated in `app/api/submit/route.ts` before writing to Sheets (job name, site, contact, fixturesOperable, etc.).
- **Status updates:** PATCH only allows transitions `new → reviewed`, `new → closed`, `reviewed → closed`.
- **Rate limiting:** The public submit endpoint is limited to 20 requests per minute per client IP (in-memory; for strict limits in production consider Vercel rate limiting or similar).

## Form fields (mapped to the PDF)
- Job name; site address/location
- Field contact: name, email, phone
- Drawing link (sheet with fixture types / layout / control zones)
- Programming narrative (scenes, priorities: daily, holidays, sports, etc.)
- Fixtures correctly wired/operable (radio) + wiring/DMX test notes
- DMX controls/splitters access confirmation (checkbox)
- Additional notes for scheduling/coordination
