import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  rowToSubmission,
  SUBMISSION_STATUS,
  type SubmissionRow,
  type SubmissionStatus,
} from "@/lib/sheet-schema";
import { getSheetsClient } from "@/lib/sheets-client";

export const dynamic = "force-dynamic";

function parseStatusParam(
  request: NextRequest
): SubmissionStatus | undefined {
  const status = request.nextUrl.searchParams.get("status");
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (SUBMISSION_STATUS.includes(normalized as SubmissionStatus)) {
    return normalized as SubmissionStatus;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const { sheets, sheetsId } = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range: "Sheet1!A:R",
    });

    const rows = (res.data.values ?? []) as unknown[][];
    const dataRows = rows.length <= 1 ? [] : rows.slice(1);
    const submissions: SubmissionRow[] = dataRows.map((row, i) =>
      rowToSubmission(row, i + 2)
    );

    const statusFilter = parseStatusParam(request);
    const filtered = statusFilter
      ? submissions.filter((s) => s.status === statusFilter)
      : submissions;

    return NextResponse.json({ submissions: filtered });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
