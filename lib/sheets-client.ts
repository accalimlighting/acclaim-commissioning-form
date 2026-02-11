import { google } from "googleapis";

const REQUIRED_ENV = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_KEY",
  "GOOGLE_SHEETS_ID",
];

const SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];

export function validateSheetsEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

export function getSheetsClient() {
  validateSheetsEnv();

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(
    /\\n/g,
    "\n"
  );
  const sheetsId = process.env.GOOGLE_SHEETS_ID!;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPE,
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  return { sheets, sheetsId };
}
