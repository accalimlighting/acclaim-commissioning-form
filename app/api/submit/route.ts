import { NextResponse } from "next/server";
import {
  COL,
  DEFAULT_STATUS,
  type SubmissionStatus,
} from "@/lib/sheet-schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSheetsClient } from "@/lib/sheets-client";

type Payload = {
  jobName: string;
  siteAddress: string;
  purchaseOrder: string;
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

function parsePayload(data: unknown): Payload {
  const body = data as Record<string, unknown>;
  const requiredStrings: Array<keyof Payload> = [
    "jobName",
    "siteAddress",
    "purchaseOrder",
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
    purchaseOrder: body.purchaseOrder as string,
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

function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (real) return real;
  return "unknown";
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429 }
    );
  }
  try {
    const body = await request.json();
    const payload = parsePayload(body);
    const { sheets, sheetsId } = getSheetsClient();

    const submissionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const status: SubmissionStatus = DEFAULT_STATUS;

    const row: (string | number)[] = [];
    row[COL.submissionId] = submissionId;
    row[COL.timestamp] = timestamp;
    row[COL.jobName] = payload.jobName;
    row[COL.siteAddress] = payload.siteAddress;
    row[COL.contactName] = payload.contactName;
    row[COL.contactEmail] = payload.contactEmail;
    row[COL.contactPhone] = payload.contactPhone;
    row[COL.drawingLink] = payload.drawingLink ?? "";
    row[COL.programmingNarrative] = payload.programmingNarrative ?? "";
    row[COL.fixturesOperable] = payload.fixturesOperable === "yes" ? "Yes" : "No";
    row[COL.wiringNotes] = payload.wiringNotes ?? "";
    row[COL.dmxAccessAvailable] = payload.dmxAccessAvailable ? "Yes" : "No";
    row[COL.additionalNotes] = payload.additionalNotes ?? "";
    row[COL.status] = status;
    row[COL.reviewedBy] = "";
    row[COL.reviewedAt] = "";
    row[COL.closedAt] = "";
    row[COL.internalNotes] = "";
    row[COL.purchaseOrder] = payload.purchaseOrder;
    row[COL.scheduledOn] = "";
    row[COL.completedOn] = "";

    const values = [row.map((v) => (v == null ? "" : String(v)))];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ ok: true, submissionId });
  } catch (error) {
    let message = error instanceof Error ? error.message : "Unknown error occurred";

    // Surface actionable guidance for common private key formatting issues.
    if (
      typeof message === "string" &&
      (message.includes("DECODER routines::unsupported") ||
        message.includes("error:1E08010C"))
    ) {
      message =
        'Google service account key is misformatted. Re-save GOOGLE_SERVICE_ACCOUNT_KEY as the full PEM key and preserve "\\n" line breaks.';
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
