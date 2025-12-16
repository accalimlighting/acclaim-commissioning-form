import { google } from "googleapis";
import { NextResponse } from "next/server";

type Payload = {
  jobName: string;
  siteAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  drawingLink?: string;
  programmingNarrative?: string;
  fixturesOperable: "yes" | "no";
  wiringNotes?: string;
  dmxAccessAvailable?: boolean;
  additionalNotes?: string;
};

const REQUIRED_ENV = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_KEY",
  "GOOGLE_SHEETS_ID",
];

const SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

function parsePayload(data: unknown): Payload {
  const body = data as Record<string, unknown>;
  const requiredStrings: Array<keyof Payload> = [
    "jobName",
    "siteAddress",
    "contactName",
    "contactEmail",
    "contactPhone",
  ];

  requiredStrings.forEach((field) => {
    const value = body[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Field "${field}" is required.`);
    }
  });

  const fixturesOperable = body.fixturesOperable;
  if (fixturesOperable !== "yes" && fixturesOperable !== "no") {
    throw new Error('Field "fixturesOperable" must be "yes" or "no".');
  }

  return {
    jobName: body.jobName as string,
    siteAddress: body.siteAddress as string,
    contactName: body.contactName as string,
    contactEmail: body.contactEmail as string,
    contactPhone: body.contactPhone as string,
    drawingLink:
      typeof body.drawingLink === "string" ? body.drawingLink : undefined,
    programmingNarrative:
      typeof body.programmingNarrative === "string"
        ? body.programmingNarrative
        : undefined,
    fixturesOperable,
    wiringNotes:
      typeof body.wiringNotes === "string" ? body.wiringNotes : undefined,
    dmxAccessAvailable:
      typeof body.dmxAccessAvailable === "boolean"
        ? body.dmxAccessAvailable
        : false,
    additionalNotes:
      typeof body.additionalNotes === "string" ? body.additionalNotes : undefined,
  };
}

function getSheetsClient() {
  validateEnv();

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parsePayload(body);
    const { sheets, sheetsId } = getSheetsClient();

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      payload.jobName,
      payload.siteAddress,
      payload.contactName,
      payload.contactEmail,
      payload.contactPhone,
      payload.drawingLink || "",
      payload.programmingNarrative || "",
      payload.fixturesOperable === "yes" ? "Yes" : "No",
      payload.wiringNotes || "",
      payload.dmxAccessAvailable ? "Yes" : "No",
      payload.additionalNotes || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

