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
Notes:
- Preserve newline escapes (`\n`) in the private key when pasting into env vars.
- Share the target Sheet with the service account email with Editor access.
- The API writes to `Sheet1!A1`; rename `Sheet1` if you prefer but keep the range in `app/api/submit/route.ts` in sync.
- Suisse Intl fonts: drop `SuisseIntl-Regular/Medium/SemiBold` `.woff2` (or `.woff`) into `public/fonts/`. The CSS already references these names; if you cannot commit the files, keep them local or upload to your host as static assets.

## Local development
```bash
npm install
npm run dev
# visit http://localhost:3000
```

## Deploy to Vercel
1. Push the repo or import into Vercel.
2. Add the three environment variables above in Vercel Project Settings → Environment Variables.
3. Deploy. Vercel will host the static form and the API route that writes to Sheets.

## Data captured (column order)
1. Timestamp (ISO)
2. Job name
3. Site address
4. Field contact name
5. Field contact email
6. Field contact phone
7. Drawing link
8. Programming narrative
9. Fixtures operable (Yes/No)
10. Wiring/DMX notes
11. DMX access available (Yes/No)
12. Additional notes

## Form fields (mapped to the PDF)
- Job name; site address/location
- Field contact: name, email, phone
- Drawing link (sheet with fixture types / layout / control zones)
- Programming narrative (scenes, priorities: daily, holidays, sports, etc.)
- Fixtures correctly wired/operable (radio) + wiring/DMX test notes
- DMX controls/splitters access confirmation (checkbox)
- Additional notes for scheduling/coordination
