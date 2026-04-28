"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DiscoveryFormContent = {
  locale: "in" | "id";
  meta: {
    backHome: string;
    badge: string;
    heading: string;
    headingAccent: string;
    subtitle: string;
    sideImage: string;
    sideQuote: string;
    sideAttribution: string;
  };
  sections: {
    personal: {
      title: string;
      fields: {
        name: string;
        specialization: string;
        clinic: string;
        city: string;
        whatsapp: string;
        email: string;
      };
    };
    practice: {
      title: string;
      patientsQ: string;
      patientsOptions: string[];
      storageQ: string;
      storageOptions: string[];
      otherPlaceholder: string;
    };
    challenges: {
      title: string;
      paperworkQ: string;
      paperworkOptions: string[];
      shiftQ: string;
      shiftOptions: string[];
      referralQ: string;
      referralOptions: string[];
      problemsQ: string;
      problemsOptions: string[];
    };
    priority: {
      title: string;
      question: string;
      helper: string;
      options: string[];
    };
    more: {
      title: string;
      question: string;
      placeholder: string;
    };
  };
  submit: {
    button: string;
    submitting: string;
    required: string;
    error: string;
  };
  success: {
    title: string;
    body: string;
    cta: string;
  };
};

type FormState = {
  name: string;
  specialization: string;
  clinic: string;
  city: string;
  whatsapp: string;
  email: string;
  patientsPerDay: string;
  dataStorage: string[];
  dataStorageOther: string;
  paperworkTime: string;
  shiftNotes: string;
  referralTime: string;
  problems: string[];
  priorities: string[];
  tellUsMore: string;
};

const initialState: FormState = {
  name: "",
  specialization: "",
  clinic: "",
  city: "",
  whatsapp: "",
  email: "",
  patientsPerDay: "",
  dataStorage: [],
  dataStorageOther: "",
  paperworkTime: "",
  shiftNotes: "",
  referralTime: "",
  problems: [],
  priorities: [],
  tellUsMore: "",
};

export function DiscoveryForm({ content }: { content: DiscoveryFormContent }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleMulti = (
    key: "dataStorage" | "problems" | "priorities",
    value: string,
    max?: number,
  ) => {
    setForm((f) => {
      const current = f[key];
      if (current.includes(value)) {
        return { ...f, [key]: current.filter((v) => v !== value) };
      }
      if (max && current.length >= max) return f;
      return { ...f, [key]: [...current, value] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/discovery-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: content.locale, ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || content.submit.error);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : content.submit.error);
    }
  };

  if (status === "success") {
    return (
      <div className="h-screen bg-background relative overflow-hidden">
        <BgGlow />
        <main className="relative h-screen grid grid-cols-1 lg:grid-cols-2">
          {/* Left — Success */}
          <div className="flex flex-col h-full min-h-0">
            <Logo />
            <div className="flex-1 flex items-center px-6 lg:px-8 xl:px-12 pb-10">
              <div className="w-full max-w-xl">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-gradient">{content.success.title}</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {content.success.body}
                </p>
                <Link href="/">
                  <Button size="lg" className="font-semibold">
                    {content.success.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Right — Image */}
          <SideImage content={content} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background relative overflow-hidden">
      <BgGlow />

      <main className="relative h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left — Form */}
        <div className="flex flex-col h-full min-h-0">
          <Logo />

          <div className="flex-shrink-0 px-6 lg:px-8 xl:px-12 pb-6">
            <div className="w-full max-w-xl">
              <h1 className="text-[1.7rem] sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance leading-[1.12]">
                {content.meta.heading}{" "}
                <span className="text-gradient">
                  {content.meta.headingAccent}
                </span>
              </h1>
              <p className="text-base text-foreground/70 leading-relaxed">
                {content.meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 lg:px-8 xl:px-12 pb-10">
            <div className="w-full max-w-xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Personal Info */}
                <Section number="1" title={content.sections.personal.title}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label={content.sections.personal.fields.name}
                      required
                    >
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60 focus-visible:ring-primary/40"
                      />
                    </Field>
                    <Field
                      label={content.sections.personal.fields.specialization}
                      required
                    >
                      <Input
                        required
                        value={form.specialization}
                        onChange={(e) =>
                          update("specialization", e.target.value)
                        }
                        className="h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60 focus-visible:ring-primary/40"
                      />
                    </Field>
                    <Field
                      label={content.sections.personal.fields.clinic}
                      required
                    >
                      <Input
                        required
                        value={form.clinic}
                        onChange={(e) => update("clinic", e.target.value)}
                        className="h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60 focus-visible:ring-primary/40"
                      />
                    </Field>
                    <Field
                      label={content.sections.personal.fields.city}
                      required
                    >
                      <Input
                        required
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className="h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60 focus-visible:ring-primary/40"
                      />
                    </Field>
                    <Field
                      label={content.sections.personal.fields.whatsapp}
                      required
                    >
                      <Input
                        required
                        type="tel"
                        inputMode="tel"
                        value={form.whatsapp}
                        onChange={(e) => update("whatsapp", e.target.value)}
                        className="h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60 focus-visible:ring-primary/40"
                      />
                    </Field>
                    <Field label={content.sections.personal.fields.email}>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60 focus-visible:ring-primary/40"
                      />
                    </Field>
                  </div>
                </Section>

                {/* Section 2: Current Practice Setup */}
                <Section number="2" title={content.sections.practice.title}>
                  <QuestionGroup label={content.sections.practice.patientsQ}>
                    <div className="grid grid-cols-2 gap-2">
                      {content.sections.practice.patientsOptions.map((opt) => (
                        <Radio
                          key={opt}
                          name="patientsPerDay"
                          label={opt}
                          checked={form.patientsPerDay === opt}
                          onChange={() => update("patientsPerDay", opt)}
                        />
                      ))}
                    </div>
                  </QuestionGroup>

                  <QuestionGroup label={content.sections.practice.storageQ}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {content.sections.practice.storageOptions.map((opt) => (
                        <Checkbox
                          key={opt}
                          label={opt}
                          checked={form.dataStorage.includes(opt)}
                          onChange={() => toggleMulti("dataStorage", opt)}
                        />
                      ))}
                    </div>
                    {form.dataStorage.includes(
                      content.sections.practice.storageOptions[3],
                    ) && (
                      <Input
                        className="mt-3 h-11"
                        placeholder={content.sections.practice.otherPlaceholder}
                        value={form.dataStorageOther}
                        onChange={(e) =>
                          update("dataStorageOther", e.target.value)
                        }
                      />
                    )}
                  </QuestionGroup>
                </Section>

                {/* Section 3: Daily Challenges */}
                <Section number="3" title={content.sections.challenges.title}>
                  <QuestionGroup label={content.sections.challenges.paperworkQ}>
                    <div className="grid grid-cols-2 gap-2">
                      {content.sections.challenges.paperworkOptions.map(
                        (opt) => (
                          <Radio
                            key={opt}
                            name="paperworkTime"
                            label={opt}
                            checked={form.paperworkTime === opt}
                            onChange={() => update("paperworkTime", opt)}
                          />
                        ),
                      )}
                    </div>
                  </QuestionGroup>

                  <QuestionGroup label={content.sections.challenges.shiftQ}>
                    <div className="grid grid-cols-2 gap-2">
                      {content.sections.challenges.shiftOptions.map((opt) => (
                        <Radio
                          key={opt}
                          name="shiftNotes"
                          label={opt}
                          checked={form.shiftNotes === opt}
                          onChange={() => update("shiftNotes", opt)}
                        />
                      ))}
                    </div>
                  </QuestionGroup>

                  <QuestionGroup label={content.sections.challenges.referralQ}>
                    <div className="grid grid-cols-2 gap-2">
                      {content.sections.challenges.referralOptions.map(
                        (opt) => (
                          <Radio
                            key={opt}
                            name="referralTime"
                            label={opt}
                            checked={form.referralTime === opt}
                            onChange={() => update("referralTime", opt)}
                          />
                        ),
                      )}
                    </div>
                  </QuestionGroup>

                  <QuestionGroup label={content.sections.challenges.problemsQ}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {content.sections.challenges.problemsOptions.map(
                        (opt) => (
                          <Checkbox
                            key={opt}
                            label={opt}
                            checked={form.problems.includes(opt)}
                            onChange={() => toggleMulti("problems", opt)}
                          />
                        ),
                      )}
                    </div>
                  </QuestionGroup>
                </Section>

                {/* Section 4: Priority */}
                <Section number="4" title={content.sections.priority.title}>
                  <QuestionGroup
                    label={content.sections.priority.question}
                    helper={content.sections.priority.helper}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {content.sections.priority.options.map((opt) => {
                        const checked = form.priorities.includes(opt);
                        const disabled =
                          !checked && form.priorities.length >= 2;
                        return (
                          <Checkbox
                            key={opt}
                            label={opt}
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleMulti("priorities", opt, 2)}
                          />
                        );
                      })}
                    </div>
                  </QuestionGroup>
                </Section>

                {/* Section 5: Tell Us More */}
                <Section number="5" title={content.sections.more.title}>
                  <QuestionGroup label={content.sections.more.question}>
                    <textarea
                      value={form.tellUsMore}
                      onChange={(e) => update("tellUsMore", e.target.value)}
                      placeholder={content.sections.more.placeholder}
                      rows={4}
                      className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-base md:text-sm placeholder:text-foreground/40 focus-visible:border-primary/60 focus-visible:ring-primary/40 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] resize-none"
                    />
                  </QuestionGroup>
                </Section>

                {errorMsg && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={status === "submitting"}
                  className="w-full font-semibold h-12 text-base"
                >
                  {status === "submitting"
                    ? content.submit.submitting
                    : content.submit.button}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right — Image (desktop only) */}
        <SideImage content={content} />
      </main>
    </div>
  );
}

function BgGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 p-6 lg:p-8">
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/larinova-icon.png"
          alt="Larinova"
          width={36}
          height={36}
          className="object-contain"
        />
        <span className="font-semibold text-foreground tracking-tight text-lg">
          Larinova
        </span>
      </Link>
    </div>
  );
}

function SideImage({ content }: { content: DiscoveryFormContent }) {
  return (
    <div className="hidden lg:flex items-center justify-center p-6 xl:p-8">
      <div className="relative w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl aspect-[3/4] rounded-2xl overflow-hidden border border-border/20">
        <Image
          src={content.meta.sideImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/60 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <p className="text-xl font-semibold text-white leading-snug">
            &ldquo;{content.meta.sideQuote}&rdquo;
          </p>
          <p className="text-sm text-white/50 mt-3">
            {content.meta.sideAttribution}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.08]">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-[0_4px_14px_-4px_rgba(16,185,129,0.6)]">
          {number}
        </span>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        <span
          aria-hidden
          className="ml-auto h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent"
        />
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground/80 mb-1.5">
        {label}
        {required && (
          <span className="text-rose-400 ml-1" aria-hidden>
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function QuestionGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {helper && <p className="text-xs text-muted-foreground mb-3">{helper}</p>}
      {!helper && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Radio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all",
        checked
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/40 hover:bg-card",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={cn(
          "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
          checked ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
        checked
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/40 hover:bg-card",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
          checked ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
