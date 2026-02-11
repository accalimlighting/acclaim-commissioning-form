/**
 * Google Sheet column schema for commissioning submissions.
 * Sheet1 row 1 = headers; data starts row 2. Append writes to the next empty row.
 *
 * Column order (0-based index):
 * 0: Submission ID (UUID)
 * 1: Timestamp (ISO)
 * 2: Job name
 * 3: Site address
 * 4: Contact name
 * 5: Contact email
 * 6: Contact phone
 * 7: Drawing link
 * 8: Programming narrative
 * 9: Fixtures operable (Yes/No)
 * 10: Wiring notes
 * 11: DMX access available (Yes/No)
 * 12: Additional notes
 * 13: Status (new | reviewed | closed)
 * 14: Reviewed By
 * 15: Reviewed At (ISO)
 * 16: Closed At (ISO)
 * 17: Internal Notes
 * 18: Purchase Order
 * 19: Scheduled On
 * 20: Completed On
 */

export const SUBMISSION_STATUS = ["new", "reviewed", "closed"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[number];

export const SHEET_HEADERS = [
  "Submission ID",
  "Timestamp",
  "Job name",
  "Site address",
  "Contact name",
  "Contact email",
  "Contact phone",
  "Drawing link",
  "Programming narrative",
  "Fixtures operable",
  "Wiring notes",
  "DMX access available",
  "Additional notes",
  "Status",
  "Reviewed By",
  "Reviewed At",
  "Closed At",
  "Internal Notes",
  "Purchase Order",
  "Scheduled On",
  "Completed On",
] as const;

export const COL = {
  submissionId: 0,
  timestamp: 1,
  jobName: 2,
  siteAddress: 3,
  contactName: 4,
  contactEmail: 5,
  contactPhone: 6,
  drawingLink: 7,
  programmingNarrative: 8,
  fixturesOperable: 9,
  wiringNotes: 10,
  dmxAccessAvailable: 11,
  additionalNotes: 12,
  status: 13,
  reviewedBy: 14,
  reviewedAt: 15,
  closedAt: 16,
  internalNotes: 17,
  purchaseOrder: 18,
  scheduledOn: 19,
  completedOn: 20,
} as const;

export const DEFAULT_STATUS: SubmissionStatus = "new";

export interface SubmissionRow {
  submissionId: string;
  timestamp: string;
  jobName: string;
  siteAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  drawingLink: string;
  programmingNarrative: string;
  fixturesOperable: string;
  wiringNotes: string;
  dmxAccessAvailable: string;
  additionalNotes: string;
  status: SubmissionStatus;
  reviewedBy: string;
  reviewedAt: string;
  closedAt: string;
  internalNotes: string;
  purchaseOrder: string;
  scheduledOn: string;
  completedOn: string;
}

/** Parse a raw row from Sheets (array of cell values) into SubmissionRow. */
export function rowToSubmission(row: unknown[], rowIndex: number): SubmissionRow {
  const get = (i: number) => (row[i] != null ? String(row[i]).trim() : "");
  const statusRaw = get(COL.status).toLowerCase() || DEFAULT_STATUS;
  const status: SubmissionStatus = SUBMISSION_STATUS.includes(statusRaw as SubmissionStatus)
    ? (statusRaw as SubmissionStatus)
    : DEFAULT_STATUS;
  return {
    submissionId: get(COL.submissionId) || `legacy-${rowIndex}`,
    timestamp: get(COL.timestamp),
    jobName: get(COL.jobName),
    siteAddress: get(COL.siteAddress),
    contactName: get(COL.contactName),
    contactEmail: get(COL.contactEmail),
    contactPhone: get(COL.contactPhone),
    drawingLink: get(COL.drawingLink),
    programmingNarrative: get(COL.programmingNarrative),
    fixturesOperable: get(COL.fixturesOperable),
    wiringNotes: get(COL.wiringNotes),
    dmxAccessAvailable: get(COL.dmxAccessAvailable),
    additionalNotes: get(COL.additionalNotes),
    status,
    reviewedBy: get(COL.reviewedBy),
    reviewedAt: get(COL.reviewedAt),
    closedAt: get(COL.closedAt),
    internalNotes: get(COL.internalNotes),
    purchaseOrder: get(COL.purchaseOrder),
    scheduledOn: get(COL.scheduledOn),
    completedOn: get(COL.completedOn),
  };
}
