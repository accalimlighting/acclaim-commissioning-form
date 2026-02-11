import { google } from "googleapis";

const REQUIRED_ENV = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_KEY",
  "GOOGLE_SHEETS_ID",
];

const SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];

function normalizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // Env providers and local shells sometimes wrap multiline keys in quotes.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Support keys supplied either with escaped newlines or real newlines.
  key = key.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

  if (!/(BEGIN (?:RSA )?PRIVATE KEY)/.test(key)) {
    throw new Error(
      'Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Expected a PEM private key (BEGIN PRIVATE KEY) with preserved "\\n" line breaks.'
    );
  }

  return key;
}

export function validateSheetsEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

export function getSheetsClient() {
  validateSheetsEnv();

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
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
