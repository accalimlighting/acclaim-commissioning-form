/* Restores the commissioning form UI and fixes pill overrides and footer contrast. */
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

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
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-40 relative">
              <Image
                src="/Acclaim_Horizontal_Logo_Dark.svg"
                alt="Acclaim Lighting"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden md:flex gap-2">
              <span className="pill pill-default">White Light Linear</span>
              <span className="pill pill-default">Commissioning</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-slate-200 md:items-end">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              For official quotations
            </span>
            <a
              className="font-semibold text-slate-100 hover:text-white"
              href="mailto:quotes@acclaimlighting.com"
            >
              quotes@acclaimlighting.com
            </a>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-10">
          <div className="glass rounded-2xl border border-white/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  Commissioning Intake
                </p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                  Linear White Light Guide – Commissioning Form
                </h1>
                <p className="max-w-3xl text-sm text-slate-200">
                  Capture project details, wiring readiness, and scene priorities
                  so field programming can move fast.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="chip">Public submission</span>
                <span className="chip">Sheets storage</span>
                <span className="chip">DMX readiness</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="glass rounded-2xl border border-white/10 p-8 shadow-xl">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Project details
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Key project information
                  </h2>
                  <p className="text-sm text-slate-300">
                    Based on the attached commissioning form.
                  </p>
                </div>
                <span className="pill pill-emerald">Required fields noted</span>
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
                      placeholder="e.g., Riverfront Plaza"
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
                      placeholder="Street, city, state"
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
                      placeholder="Full name"
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
                      placeholder="name@company.com"
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
                      placeholder="+1 (555) 123-4567"
                    />
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Documents & narrative
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Visual intent & control sheets
                </h2>
                  <p className="text-sm text-slate-300">
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
                      placeholder="List scenes in priority order"
                    />
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Hardware readiness
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Wiring & DMX access
                </h2>
                <p className="text-sm text-slate-300">
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
                          className="flex items-center gap-2 text-sm text-slate-100"
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
                            className="h-4 w-4 accent-rose-500"
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
                      placeholder="Document any gaps or observations"
                    />
                  }
                />
              </div>
              <div className="grid gap-4">
                <Field
                  label="Access for DMX controls and splitters will be available to field techs"
                  input={
                    <label className="flex items-center gap-3 text-sm text-slate-100">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-rose-500"
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
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Additional notes
                </p>
                <h2 className="text-xl font-semibold text-white">Notes</h2>
                <p className="text-sm text-slate-300">
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
                    placeholder="Add any clarifications for the programming team"
                  />
                }
              />
            </section>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                Submissions are stored in Google Sheets. For urgent support call
                323-213-4594.
              </div>
              <button
                type="submit"
                disabled={status.state === "submitting"}
                className="btn-primary"
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
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <span>{label}</span>
        {required ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
            Required
          </span>
        ) : null}
      </div>
      {input}
      {helper ? (
        <p className="text-xs leading-4 text-slate-300">{helper}</p>
      ) : null}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
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
      ? "bg-emerald-500/10 text-emerald-100 border-emerald-500/40"
      : "bg-rose-500/10 text-rose-100 border-rose-500/40";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}
 