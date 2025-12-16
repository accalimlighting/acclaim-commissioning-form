"use client";

import Image from "next/image";
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
    <div className="min-h-screen">
      <Hero />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="glass rounded-3xl border border-white/10 p-8 shadow-xl shadow-black/30">
          <form className="space-y-10" onSubmit={handleSubmit}>
            <Section
              kicker="Project details"
              title="Key project information"
              description="Based on the attached commissioning form."
              badge="Required fields noted"
            >
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
            </Section>

            <Section
              kicker="Documents & narrative"
              title="Visual intent & control sheets"
              description="Provide drawings and desired scenes."
            >
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
                      className="input min-h-28 resize-none"
                      value={form.programmingNarrative}
                      onChange={(e) =>
                        handleChange("programmingNarrative", e.target.value)
                      }
                      placeholder="List scenes in priority order"
                    />
                  }
                />
              </div>
            </Section>

            <Section
              kicker="Hardware readiness"
              title="Wiring & DMX access"
              description="Confirm wiring/DMX and access to controls."
            >
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
                      className="input min-h-24 resize-none"
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
            </Section>

            <Section
              kicker="Additional notes"
              title="Notes"
              description="Scheduling details or anything else the field team should know."
            >
              <Field
                label="Notes"
                input={
                  <textarea
                    className="input min-h-28 resize-none"
                    value={form.additionalNotes}
                    onChange={(e) =>
                      handleChange("additionalNotes", e.target.value)
                    }
                    placeholder="Add any clarifications for the programming team"
                  />
                }
              />
            </Section>

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

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/Acclaim_Gradient_Pattern_00_Main.jpg"
          alt="Gradient backdrop"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/35 via-slate-900/32 to-slate-950/40" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20 md:py-32">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-[3.75rem] w-[15rem]">
                <Image
                  src="/Acclaim_Horizontal_Logo_Dark.svg"
                  alt="Acclaim Lighting"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
                Commissioning Intake Form
              </h1>
              <p className="max-w-3xl text-base text-slate-100 md:text-lg">
                Submit information for planning and commissioning on your Acclaim project.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="pill pill-default px-4 py-2 text-sm font-semibold text-white/90 hover:text-white"
                href="mailto:support@acclaimlighting.com"
              >
                For additional support, please contact support@acclaimlighting.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type SectionProps = {
  kicker: string;
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
};

function Section({ kicker, title, description, badge, children }: SectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
            {kicker}
          </p>
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            {title}
          </h2>
          <p className="text-sm text-slate-300">{description}</p>
        </div>
        {badge ? <span className="pill pill-emerald">{badge}</span> : null}
      </div>
      {children}
    </section>
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
 