"use client";

import { useCallback, useEffect, useState } from "react";
import type { SubmissionRow } from "@/lib/sheet-schema";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "closed", label: "Closed" },
] as const;

function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("key") ?? "";
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reviewedBy, setReviewedBy] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const key = getAdminKey();
    const url = statusFilter
      ? `/api/submissions?status=${statusFilter}`
      : "/api/submissions";
    try {
      const res = await fetch(url, {
        headers: key ? { "x-admin-key": key } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const updateStatus = async (
    submissionId: string,
    status: "reviewed" | "closed"
  ) => {
    if (!selected || selected.submissionId !== submissionId) return;
    setUpdating(true);
    const key = getAdminKey();
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { "x-admin-key": key } : {}),
        },
        body: JSON.stringify({
          status,
          reviewedBy: reviewedBy || undefined,
          internalNotes: internalNotes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as SubmissionRow;
      setSubmissions((prev) =>
        prev.map((s) => (s.submissionId === updated.submissionId ? updated : s))
      );
      setSelected(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const openDetail = (row: SubmissionRow) => {
    setSelected(row);
    setReviewedBy(row.reviewedBy);
    setInternalNotes(row.internalNotes);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-suisse-bold mb-2 text-2xl text-slate-900">
          Commissioning submissions
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Review and close out submissions. Data is stored in Google Sheets.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Status
            <select
              className="input w-auto min-w-[120px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => fetchSubmissions()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-700">Job</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Site</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Contact</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Submitted</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No submissions match the filter.
                    </td>
                  </tr>
                ) : (
                  submissions.map((row) => (
                    <tr
                      key={row.submissionId}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-900">{row.jobName}</td>
                      <td className="px-4 py-3 text-slate-600">{row.siteAddress}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.contactName}
                        {row.contactEmail && ` (${row.contactEmail})`}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.status === "new"
                              ? "bg-amber-100 text-amber-800"
                              : row.status === "reviewed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="text-slate-600 underline hover:text-slate-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <DetailPanel
            submission={selected}
            reviewedBy={reviewedBy}
            internalNotes={internalNotes}
            onReviewedByChange={setReviewedBy}
            onInternalNotesChange={setInternalNotes}
            onUpdateStatus={updateStatus}
            onClose={() => setSelected(null)}
            updating={updating}
          />
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  submission,
  reviewedBy,
  internalNotes,
  onReviewedByChange,
  onInternalNotesChange,
  onUpdateStatus,
  onClose,
  updating,
}: {
  submission: SubmissionRow;
  reviewedBy: string;
  internalNotes: string;
  onReviewedByChange: (v: string) => void;
  onInternalNotesChange: (v: string) => void;
  onUpdateStatus: (id: string, status: "reviewed" | "closed") => Promise<void>;
  onClose: () => void;
  updating: boolean;
}) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="font-suisse-bold text-lg text-slate-900">
            {submission.jobName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <DetailRow label="Submission ID" value={submission.submissionId} />
          <DetailRow label="Submitted" value={submission.timestamp ? new Date(submission.timestamp).toLocaleString() : "—"} />
          <DetailRow label="Site address" value={submission.siteAddress} />
          <DetailRow label="Contact" value={submission.contactName} />
          <DetailRow label="Email" value={submission.contactEmail} />
          <DetailRow label="Phone" value={submission.contactPhone} />
          <DetailRow label="Purchase order" value={submission.purchaseOrder} />
          <DetailRow label="Drawing link" value={submission.drawingLink} link />
          <DetailRow label="Programming narrative" value={submission.programmingNarrative} />
          <DetailRow label="Fixtures operable" value={submission.fixturesOperable} />
          <DetailRow label="Wiring notes" value={submission.wiringNotes} />
          <DetailRow label="DMX access available" value={submission.dmxAccessAvailable} />
          <DetailRow label="Additional notes" value={submission.additionalNotes} />
          <DetailRow label="Status" value={submission.status} />
          {submission.reviewedBy && (
            <DetailRow label="Reviewed by" value={submission.reviewedBy} />
          )}
          {submission.reviewedAt && (
            <DetailRow label="Reviewed at" value={new Date(submission.reviewedAt).toLocaleString()} />
          )}
          {submission.closedAt && (
            <DetailRow label="Closed at" value={new Date(submission.closedAt).toLocaleString()} />
          )}
          {submission.scheduledOn && (
            <DetailRow label="Scheduled on" value={submission.scheduledOn} />
          )}
          {submission.completedOn && (
            <DetailRow label="Completed on" value={submission.completedOn} />
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reviewed by (saved on status change)
            </label>
            <input
              type="text"
              className="input"
              value={reviewedBy}
              onChange={(e) => onReviewedByChange(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Internal notes
            </label>
            <textarea
              className="input min-h-[80px]"
              value={internalNotes}
              onChange={(e) => onInternalNotesChange(e.target.value)}
              placeholder="Admin-only notes"
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
            {submission.status === "new" && (
              <>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => onUpdateStatus(submission.submissionId, "reviewed")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Mark reviewed
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => onUpdateStatus(submission.submissionId, "closed")}
                  className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Mark closed
                </button>
              </>
            )}
            {submission.status === "reviewed" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => onUpdateStatus(submission.submissionId, "closed")}
                className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Mark closed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: boolean;
}) {
  if (value == null || value === "") return null;
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <p className="mt-0.5 text-sm text-slate-900">
        {link && (value.startsWith("http://") || value.startsWith("https://")) ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </div>
  );
}
