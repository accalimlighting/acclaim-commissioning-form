"use client";

import { useMemo, useState } from "react";

type FormState = {
  jobName: string;
  siteAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  drawingLink: string;
  programmingNarrative: string;
  fixturesOperable: "yes" | "no" | "";
  wiringNotes: string;
  dmxAccessAvailable: boolean;
  additionalNotes: string;
};

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success" }
  | { state: "error"; message: string };

const initialState: FormState = {
  jobName: "",
  siteAddress: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  drawingLink: "",
  programmingNarrative: "",
  fixturesOperable: "",
  wiringNotes: "",
  dmxAccessAvailable: false,
  additionalNotes: "",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requiredFields = useMemo(
    () => ({
      jobName: "Job name is required.",
      siteAddress: "Site address is required.",
      contactName: "Field contact name is required.",
      contactEmail: "Field contact email is required.",
      contactPhone: "Field contact phone is required.",
      fixturesOperable: "Please confirm if fixtures are operable.",
    }),
    []
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    Object.entries(requiredFields).forEach(([key, message]) => {
      const value = form[key as keyof FormState];
      if (typeof value === "string" && value.trim().length === 0) {
        nextErrors[key] = message;
      }
      if (key === "fixturesOperable" && value === "") {
        nextErrors[key] = message;
      }
    });
    if (form.contactEmail && !/\S+@\S+\.\S+/.test(form.contactEmail)) {
      nextErrors.contactEmail = "Enter a valid email.";
    }
    if (
      form.contactPhone &&
      !/^[+()\\d\\s-]{7,}$/.test(form.contactPhone.trim())
    ) {
      nextErrors.contactPhone = "Enter a valid phone number.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    field: keyof FormState,
    value: FormState[keyof FormState]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.state === "submitting") return;
    if (!validate()) return;

    setStatus({ state: "submitting" });
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Unable to submit form. Please retry.");
      }

      setStatus({ state: "success" });
      setForm(initialState);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";
      setStatus({ state: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Acclaim</p>
            <h1 className="text-xl font-semibold text-slate-900">
              Commissioning Form
            </h1>
          </div>
          <div className="hidden text-sm text-slate-500 sm:block">
            Public submission · Stored to Google Sheets
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Project details
                </h2>
                <p className="text-sm text-slate-600">
                  Based on the attached commissioning form.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Job name"
                  required
                  error={errors.jobName}
                  input={
                    <input
                      type="text"
                      className="input"
                      value={form.jobName}
                      onChange={(e) => handleChange("jobName", e.target.value)}
                    />
                  }
                />
                <Field
                  label="Site address and location"
                  required
                  error={errors.siteAddress}
                  input={
                    <input
                      type="text"
                      className="input"
                      value={form.siteAddress}
                      onChange={(e) =>
                        handleChange("siteAddress", e.target.value)
                      }
                    />
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Field contact name"
                  required
                  error={errors.contactName}
                  input={
                    <input
                      type="text"
                      className="input"
                      value={form.contactName}
                      onChange={(e) =>
                        handleChange("contactName", e.target.value)
                      }
                    />
                  }
                />
                <Field
                  label="Field contact email"
                  required
                  error={errors.contactEmail}
                  input={
                    <input
                      type="email"
                      className="input"
                      value={form.contactEmail}
                      onChange={(e) =>
                        handleChange("contactEmail", e.target.value)
                      }
                    />
                  }
                />
                <Field
                  label="Field contact phone"
                  required
                  error={errors.contactPhone}
                  input={
                    <input
                      type="tel"
                      className="input"
                      value={form.contactPhone}
                      onChange={(e) =>
                        handleChange("contactPhone", e.target.value)
                      }
                    />
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Documents and narrative
                  </h2>
                  <p className="text-sm text-slate-600">
                    Provide drawings and desired scenes.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Drawing link (Drive, SharePoint, etc.)"
                  helper="Include sheet with fixture types, layout, control zones."
                  input={
                    <input
                      type="url"
                      className="input"
                      placeholder="https://..."
                      value={form.drawingLink}
                      onChange={(e) =>
                        handleChange("drawingLink", e.target.value)
                      }
                    />
                  }
                />
                <Field
                  label="Programming narrative"
                  helper="Scenes or visual priorities (daily, holidays, sports, etc.)."
                  input={
                    <textarea
                      className="input min-h-24 resize-none"
                      value={form.programmingNarrative}
                      onChange={(e) =>
                        handleChange("programmingNarrative", e.target.value)
                      }
                    />
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Hardware readiness
                </h2>
                <p className="text-sm text-slate-600">
                  Confirm wiring/DMX and access to controls.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Are all fixtures correctly wired and operable?"
                  required
                  error={errors.fixturesOperable}
                  input={
                    <div className="flex gap-4">
                      {["yes", "no"].map((value) => (
                        <label
                          key={value}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="radio"
                            name="fixturesOperable"
                            value={value}
                            checked={form.fixturesOperable === value}
                            onChange={() =>
                              handleChange(
                                "fixturesOperable",
                                value as FormState["fixturesOperable"]
                              )
                            }
                            className="h-4 w-4 accent-slate-900"
                          />
                          {value === "yes" ? "Yes" : "No"}
                        </label>
                      ))}
                    </div>
                  }
                />
                <Field
                  label="Notes on wiring/DMX testing"
                  helper="Include results (e.g., Art500/Pharos reaction, handheld DMX tests)."
                  input={
                    <textarea
                      className="input min-h-20 resize-none"
                      value={form.wiringNotes}
                      onChange={(e) =>
                        handleChange("wiringNotes", e.target.value)
                      }
                    />
                  }
                />
              </div>
              <div className="grid gap-4">
                <Field
                  label="Access for DMX controls and splitters will be available to field techs"
                  input={
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slate-900"
                        checked={form.dmxAccessAvailable}
                        onChange={(e) =>
                          handleChange("dmxAccessAvailable", e.target.checked)
                        }
                      />
                      Confirm access to DMX controls, splitters, and start
                      cables/drivers.
                    </label>
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Additional notes
                </h2>
                <p className="text-sm text-slate-600">
                  Scheduling details or anything else the field team should know.
                </p>
              </div>
              <Field
                label="Notes"
                input={
                  <textarea
                    className="input min-h-24 resize-none"
                    value={form.additionalNotes}
                    onChange={(e) =>
                      handleChange("additionalNotes", e.target.value)
                    }
                  />
                }
              />
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Submissions are stored in Google Sheets. For urgent support call
                323-213-4594.
              </div>
              <button
                type="submit"
                disabled={status.state === "submitting"}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {status.state === "submitting" ? "Submitting..." : "Submit form"}
              </button>
            </div>

            {status.state === "success" && (
              <Banner kind="success" message="Submitted successfully." />
            )}
            {status.state === "error" && (
              <Banner kind="error" message={status.message} />
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

type FieldProps = {
  label: string;
  input: React.ReactNode;
  helper?: string;
  required?: boolean;
  error?: string;
};

function Field({ label, input, helper, required, error }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span>{label}</span>
        {required ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Required
          </span>
        ) : null}
      </div>
      {input}
      {helper ? (
        <p className="text-xs text-slate-600 leading-4">{helper}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type BannerProps = {
  kind: "success" | "error";
  message: string;
};

function Banner({ kind, message }: BannerProps) {
  const styles =
    kind === "success"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : "bg-rose-50 text-rose-900 border-rose-200";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}
