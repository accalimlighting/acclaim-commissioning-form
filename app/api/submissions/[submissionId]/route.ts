import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  COL,
  rowToSubmission,
  SUBMISSION_STATUS,
  type SubmissionRow,
  type SubmissionStatus,
} from "@/lib/sheet-schema";
import { getSheetsClient } from "@/lib/sheets-client";

export const dynamic = "force-dynamic";

const VALID_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  new: ["reviewed", "closed"],
  reviewed: ["closed"],
  closed: [],
};

function parseBody(data: unknown): {
  status?: SubmissionStatus;
  reviewedBy?: string;
  internalNotes?: string;
} {
  const body = data as Record<string, unknown>;
  const out: {
    status?: SubmissionStatus;
    reviewedBy?: string;
    internalNotes?: string;
  } = {};
  if (body.status != null) {
    const s = String(body.status).toLowerCase();
    if (SUBMISSION_STATUS.includes(s as SubmissionStatus)) {
      out.status = s as SubmissionStatus;
    }
  }
  if (typeof body.reviewedBy === "string") out.reviewedBy = body.reviewedBy;
  if (typeof body.internalNotes === "string")
    out.internalNotes = body.internalNotes;
  return out;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const { submissionId } = await context.params;
    const body = parseBody(await request.json());
    const { sheets, sheetsId } = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range: "Sheet1!A:U",
    });

    const rows = (res.data.values ?? []) as unknown[][];
    const dataRows = rows.length <= 1 ? [] : rows.slice(1);
    const rowIndex = dataRows.findIndex((row, i) => {
      const id = row[COL.submissionId] != null ? String(row[COL.submissionId]).trim() : "";
      const legacyId = `legacy-${i + 2}`;
      return id === submissionId || (id === "" && legacyId === submissionId);
    });

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const sheetRowNumber = rowIndex + 2;
    const current = rowToSubmission(dataRows[rowIndex], sheetRowNumber);

    const allowed = VALID_TRANSITIONS[current.status];
    if (body.status != null && body.status !== current.status) {
      if (!allowed?.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from "${current.status}" to "${body.status}". Allowed: ${allowed?.join(", ") ?? "none"}.`,
          },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const updated: string[] = [...dataRows[rowIndex].map((c) => (c != null ? String(c) : ""))];

    while (updated.length <= COL.completedOn) {
      updated.push("");
    }

    if (body.status != null) {
      updated[COL.status] = body.status;
      if (body.status === "reviewed") {
        updated[COL.reviewedAt] = now;
        if (body.reviewedBy != null) updated[COL.reviewedBy] = body.reviewedBy;
      }
      if (body.status === "closed") {
        updated[COL.closedAt] = now;
        updated[COL.completedOn] = now;
        if (body.reviewedBy != null) updated[COL.reviewedBy] = body.reviewedBy;
      }
    }
    if (body.reviewedBy != null && updated[COL.reviewedBy] === "") {
      updated[COL.reviewedBy] = body.reviewedBy;
    }
    if (body.internalNotes != null) {
      updated[COL.internalNotes] = body.internalNotes;
    }

    const range = `Sheet1!A${sheetRowNumber}:U${sheetRowNumber}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetsId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updated],
      },
    });

    const result: SubmissionRow = rowToSubmission(updated, sheetRowNumber);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
