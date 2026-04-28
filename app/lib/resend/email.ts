import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "hello@larinova.com";

// ─── Consultation Summary Email ──────────────────────────────────────────────

export async function sendConsultationSummary({
  patientEmail,
  patientName,
  doctorName,
  consultationDate,
  summary,
  diagnosis,
  prescriptions,
  doctorNotes,
}: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  consultationDate: string;
  summary: string;
  diagnosis: string;
  prescriptions: any[];
  doctorNotes?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: patientEmail,
      subject: `Your Consultation Summary — ${consultationDate}`,
      html: generateSummaryEmailHtml({
        patientName,
        doctorName,
        consultationDate,
        summary,
        diagnosis,
        doctorNotes,
      }),
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send exception:", error);
    return { success: false, error };
  }
}

// ─── Prescription Email ───────────────────────────────────────────────────────

export async function sendPrescriptionEmail({
  patientEmail,
  patientName,
  doctorName,
  consultationDate,
  diagnosis,
  prescriptionCode,
  medicines,
  followUpDate,
  allergyWarnings,
  doctorNotes,
}: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  consultationDate: string;
  diagnosis: string;
  prescriptionCode: string;
  medicines: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    food_timing?: string;
    instructions?: string;
    quantity?: number | null;
  }>;
  followUpDate?: string | null;
  allergyWarnings?: string | null;
  doctorNotes?: string | null;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: patientEmail,
      subject: `Your Prescription — ${consultationDate}`,
      html: generatePrescriptionEmailHtml({
        patientName,
        doctorName,
        consultationDate,
        diagnosis,
        prescriptionCode,
        medicines,
        followUpDate,
        allergyWarnings,
        doctorNotes,
      }),
    });

    if (error) {
      console.error("Prescription email error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Prescription email exception:", error);
    return { success: false, error };
  }
}

// ─── HTML Templates ───────────────────────────────────────────────────────────

// Dark-mode-safe baseline. Three levers per email client family:
//   - <meta name="color-scheme" content="light dark"> — opts the message
//     into Apple Mail / iOS Mail / Gmail mobile dark adaptation
//   - @media (prefers-color-scheme: dark) — Apple Mail, iOS Mail,
//     Gmail web (Chrome/Edge), Outlook iOS, Outlook Mac
//   - [data-ogsc] / [data-ogsb] attribute selectors — Outlook Windows
//     and Outlook.com web force-darken via these JS attributes
// We DON'T fight every client; we provide explicit dark-mode colors
// so auto-inversion either picks ours or stays consistent.
const baseStyles = `
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6; color: #111; background: #f5f5f5;
    }
    .wrapper { max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #0a0a0a; padding: 28px 32px; }
    .header h1 { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; }
    .header p { color: #aaaaaa; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
    .body { padding: 32px; background: #ffffff; }
    .greeting { font-size: 15px; color: #2a2a2a; margin-bottom: 24px; }
    .greeting strong { color: #0a0a0a; }
    .section { margin-bottom: 24px; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; }
    .section-header { background: #f9f9f9; padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #555555; border-bottom: 1px solid #e5e5e5; }
    .section-body { padding: 16px; font-size: 14px; color: #2a2a2a; white-space: pre-wrap; line-height: 1.7; background: #ffffff; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .meta-cell { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #f0f0f0; background: #ffffff; }
    .meta-cell:nth-child(odd) { border-right: 1px solid #f0f0f0; }
    .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #777777; margin-bottom: 2px; }
    .meta-value { font-weight: 600; color: #0a0a0a; }
    table.rx { width: 100%; border-collapse: collapse; font-size: 13px; background: #ffffff; }
    table.rx thead tr { background: #0a0a0a; color: #ffffff; }
    table.rx thead th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .5px; }
    table.rx tbody tr { border-bottom: 1px solid #f0f0f0; }
    table.rx tbody tr:last-child { border-bottom: none; }
    table.rx tbody td { padding: 10px 12px; vertical-align: top; color: #1a1a1a; }
    table.rx tbody td .sub { font-size: 11px; color: #777777; margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; background: #f0f0f0; color: #555555; margin-right: 4px; }
    .alert { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #c53030; margin-bottom: 24px; }
    .alert strong { display: block; margin-bottom: 4px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
    .footer { padding: 20px 32px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 11px; color: #888888; background: #ffffff; }
    .footer strong { color: #555555; }
    /* ── Dark mode (Apple Mail, iOS Mail, Gmail web, Outlook iOS/Mac) ── */
    @media (prefers-color-scheme: dark) {
      body { background: #0d1117 !important; color: #e6e8eb !important; }
      .wrapper { background: #161b22 !important; box-shadow: 0 2px 12px rgba(0,0,0,0.5) !important; }
      .body { background: #161b22 !important; }
      .greeting { color: #d0d4d9 !important; }
      .greeting strong { color: #ffffff !important; }
      .section { border-color: #2c333d !important; }
      .section-header { background: #1c222b !important; color: #b8bdc4 !important; border-bottom-color: #2c333d !important; }
      .section-body { background: #161b22 !important; color: #d0d4d9 !important; }
      .meta-cell { background: #161b22 !important; border-bottom-color: #2c333d !important; }
      .meta-cell:nth-child(odd) { border-right-color: #2c333d !important; }
      .meta-label { color: #8a9098 !important; }
      .meta-value { color: #ffffff !important; }
      table.rx { background: #161b22 !important; }
      table.rx tbody tr { border-bottom-color: #2c333d !important; }
      table.rx tbody td { color: #e6e8eb !important; }
      table.rx tbody td .sub { color: #8a9098 !important; }
      .badge { background: #2c333d !important; color: #b8bdc4 !important; }
      .alert { background: #3a1d1d !important; border-color: #5a2a2a !important; color: #f5a8a8 !important; }
      .footer { background: #161b22 !important; color: #8a9098 !important; border-top-color: #2c333d !important; }
      .footer strong { color: #b8bdc4 !important; }
      /* The header is dark in BOTH modes — re-assert so auto-invert
         doesn't flip it to a light-grey that loses brand identity. */
      .header { background: #0a0a0a !important; }
      .header h1 { color: #ffffff !important; }
      .header p { color: #aaaaaa !important; }
      table.rx thead tr { background: #0a0a0a !important; color: #ffffff !important; }
    }
    /* ── Outlook Windows / Outlook.com (uses [data-ogsc]/[data-ogsb]) ── */
    [data-ogsc] body, [data-ogsb] body { background: #0d1117 !important; color: #e6e8eb !important; }
    [data-ogsc] .wrapper, [data-ogsb] .wrapper { background: #161b22 !important; }
    [data-ogsc] .body, [data-ogsb] .body { background: #161b22 !important; }
    [data-ogsc] .greeting, [data-ogsb] .greeting { color: #d0d4d9 !important; }
    [data-ogsc] .section-body, [data-ogsb] .section-body { color: #d0d4d9 !important; background: #161b22 !important; }
    [data-ogsc] .meta-value, [data-ogsb] .meta-value { color: #ffffff !important; }
    [data-ogsc] .meta-label, [data-ogsb] .meta-label { color: #8a9098 !important; }
    [data-ogsc] table.rx tbody td, [data-ogsb] table.rx tbody td { color: #e6e8eb !important; }
    [data-ogsc] .footer, [data-ogsb] .footer { background: #161b22 !important; color: #8a9098 !important; }
    @media (max-width: 600px) {
      .body { padding: 20px; }
      .meta-grid { grid-template-columns: 1fr; }
      .meta-cell:nth-child(odd) { border-right: none; }
    }
  </style>
`;

function generateSummaryEmailHtml({
  patientName,
  doctorName,
  consultationDate,
  summary,
  diagnosis,
  doctorNotes,
}: {
  patientName: string;
  doctorName: string;
  consultationDate: string;
  summary: string;
  diagnosis: string;
  doctorNotes?: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Larinova</h1>
    <p>Consultation Summary</p>
  </div>
  <div class="body">
    <div class="greeting">
      Dear <strong>${escHtml(patientName)}</strong>,<br>
      Here is the summary of your consultation with <strong>Dr. ${escHtml(doctorName)}</strong> on <strong>${escHtml(consultationDate)}</strong>.
    </div>

    <div class="section">
      <div class="section-header">📋 Consultation Details</div>
      <div class="meta-grid">
        <div class="meta-cell"><div class="meta-label">Patient</div><div class="meta-value">${escHtml(patientName)}</div></div>
        <div class="meta-cell"><div class="meta-label">Doctor</div><div class="meta-value">Dr. ${escHtml(doctorName)}</div></div>
        <div class="meta-cell"><div class="meta-label">Date</div><div class="meta-value">${escHtml(consultationDate)}</div></div>
        ${diagnosis ? `<div class="meta-cell"><div class="meta-label">Diagnosis</div><div class="meta-value">${escHtml(diagnosis)}</div></div>` : ""}
      </div>
    </div>

    ${
      summary
        ? `<div class="section">
      <div class="section-header">🩺 AI Clinical Summary</div>
      <div class="section-body">${escHtml(summary)}</div>
    </div>`
        : ""
    }

    ${
      doctorNotes
        ? `<div class="section">
      <div class="section-header">📝 Doctor's Notes</div>
      <div class="section-body">${escHtml(doctorNotes)}</div>
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-header">⚠️ Important</div>
      <div class="section-body">• Follow all instructions given by your doctor\n• Contact your doctor if symptoms worsen\n• Keep this email for your medical records</div>
    </div>
  </div>
  <div class="footer"><strong>Larinova — OPD Assistant for Indian Doctors</strong><br>Your medical data is encrypted and private &nbsp;·&nbsp; larinova.com</div>
</div>
</body></html>`;
}

function generatePrescriptionEmailHtml({
  patientName,
  doctorName,
  consultationDate,
  diagnosis,
  prescriptionCode,
  medicines,
  followUpDate,
  allergyWarnings,
  doctorNotes,
}: {
  patientName: string;
  doctorName: string;
  consultationDate: string;
  diagnosis: string;
  prescriptionCode: string;
  medicines: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    food_timing?: string;
    instructions?: string;
    quantity?: number | null;
  }>;
  followUpDate?: string | null;
  allergyWarnings?: string | null;
  doctorNotes?: string | null;
}): string {
  const medicineRows = medicines
    .map(
      (m) => `
    <tr>
      <td>
        <strong>${escHtml(m.medicine_name)}</strong>
        ${m.route ? `<div class="sub">${escHtml(m.route)}</div>` : ""}
        ${m.instructions ? `<div class="sub">${escHtml(m.instructions)}</div>` : ""}
      </td>
      <td>${escHtml(m.dosage)}</td>
      <td>
        ${escHtml(m.frequency)}
        ${m.food_timing ? `<div class="sub">${escHtml(m.food_timing)}</div>` : ""}
      </td>
      <td>${escHtml(m.duration)}</td>
      <td>${m.quantity != null ? String(m.quantity) : "—"}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Larinova</h1>
    <p>Prescription</p>
  </div>
  <div class="body">
    <div class="greeting">
      Dear <strong>${escHtml(patientName)}</strong>,<br>
      Please find your prescription from <strong>Dr. ${escHtml(doctorName)}</strong> on <strong>${escHtml(consultationDate)}</strong> below.
    </div>

    <div class="section">
      <div class="section-header">📋 Prescription Details</div>
      <div class="meta-grid">
        <div class="meta-cell"><div class="meta-label">Patient</div><div class="meta-value">${escHtml(patientName)}</div></div>
        <div class="meta-cell"><div class="meta-label">Doctor</div><div class="meta-value">Dr. ${escHtml(doctorName)}</div></div>
        <div class="meta-cell"><div class="meta-label">Date</div><div class="meta-value">${escHtml(consultationDate)}</div></div>
        <div class="meta-cell"><div class="meta-label">Rx Code</div><div class="meta-value" style="font-family:monospace">${escHtml(prescriptionCode)}</div></div>
        ${diagnosis ? `<div class="meta-cell" style="grid-column:1/-1"><div class="meta-label">Diagnosis</div><div class="meta-value">${escHtml(diagnosis)}</div></div>` : ""}
      </div>
    </div>

    ${
      allergyWarnings
        ? `<div class="alert"><strong>⚠️ Allergy Warning</strong>${escHtml(allergyWarnings)}</div>`
        : ""
    }

    <div class="section">
      <div class="section-header">💊 Medications</div>
      <table class="rx">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>${medicineRows}</tbody>
      </table>
    </div>

    ${
      followUpDate
        ? `<div class="section">
      <div class="section-header">📅 Follow-up</div>
      <div class="section-body">Please schedule a follow-up appointment on <strong>${escHtml(followUpDate)}</strong>.</div>
    </div>`
        : ""
    }

    ${
      doctorNotes
        ? `<div class="section">
      <div class="section-header">📝 Doctor's Notes</div>
      <div class="section-body">${escHtml(doctorNotes)}</div>
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-header">⚠️ Important Instructions</div>
      <div class="section-body">• Take medications exactly as prescribed\n• Complete the full course even if you feel better\n• Report any side effects to your doctor immediately\n• Store medications as directed on the packaging\n• Keep this prescription for your records</div>
    </div>
  </div>
  <div class="footer"><strong>Larinova — OPD Assistant for Indian Doctors</strong><br>Your medical data is encrypted and private &nbsp;·&nbsp; larinova.com</div>
</div>
</body></html>`;
}

function escHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Alpha Welcome (invite-code redemption) ──────────────────────────────

function firstNameFrom(fullName: string | null | undefined): string {
  if (!fullName) return "Doctor";
  const parts = fullName
    .trim()
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/);
  return parts[0] || "Doctor";
}

export async function sendAlphaWelcomeEmail({
  to,
  fullName,
  code,
}: {
  to: string;
  fullName?: string | null;
  code: string;
}): Promise<boolean> {
  const first = firstNameFrom(fullName);
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Dr. ${first}, your Larinova alpha access is here`,
      html: generateAlphaWelcomeHtml({ firstName: first, code }),
    });
    if (error) {
      console.error("Alpha welcome email error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Alpha welcome email exception:", error);
    return false;
  }
}

function generateAlphaWelcomeHtml({
  firstName,
  code,
}: {
  firstName: string;
  code: string;
}): string {
  const name = escHtml(firstName);
  const accessUrl = `https://app.larinova.com/api/invite/accept?code=${encodeURIComponent(code.toUpperCase())}&locale=in`;
  const dashboardUrl = "https://app.larinova.com";
  const videoUrl = "https://www.youtube.com/watch?v=XA01CrBcoq0";
  const videoThumb = "https://app.larinova.com/email/welcome-video-thumb.png";

  // Brand palette mirrors the app theme:
  //   --background: hsl(224 54% 8%)   → #0a1224 (deep blue-black)
  //   --primary:    hsl(160 84% 39%)  → #10b079 (emerald)
  // Emerald 50/600/700 derived for shadows + hovers.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Welcome to Larinova</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    /* Dark mode (Apple Mail, iOS Mail, Gmail web/iOS, Outlook iOS/Mac).
       The hero is brand-dark in BOTH modes, so we don't override it.
       The white card BODY needs to flip to a dark surface so light-grey
       body text doesn't auto-invert into invisible white-on-white. */
    @media (prefers-color-scheme: dark) {
      body, .dm-page { background: #0d1117 !important; }
      .dm-wrapper { background: #161b22 !important; box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important; }
      .dm-body { background: #161b22 !important; }
      .dm-text { color: #d0d4d9 !important; }
      .dm-text-strong { color: #ffffff !important; }
      .dm-text-muted { color: #8a9098 !important; }
      .dm-panel { background: #112318 !important; border-color: #1e3a2a !important; }
      .dm-panel-label { color: #34d8a0 !important; }
      .dm-panel-headline { color: #ffffff !important; }
      .dm-panel-desc { color: #b8bdc4 !important; }
      .dm-list-row { border-bottom-color: #2c333d !important; }
      .dm-list-text { color: #d0d4d9 !important; }
      .dm-list-text-strong { color: #ffffff !important; }
      .dm-signoff-border { border-top-color: #2c333d !important; }
      .dm-footer { background: #1c222b !important; border-top-color: #2c333d !important; color: #8a9098 !important; }
      .dm-footer a { color: #b8bdc4 !important; }
      .dm-footer strong { color: #c0c4ca !important; }
      .dm-video-thumb { border-color: #2c333d !important; }
    }
    /* Outlook Windows / Outlook.com — same overrides via attribute hooks */
    [data-ogsc] body, [data-ogsb] body, [data-ogsc] .dm-page, [data-ogsb] .dm-page { background: #0d1117 !important; }
    [data-ogsc] .dm-wrapper, [data-ogsb] .dm-wrapper { background: #161b22 !important; }
    [data-ogsc] .dm-body, [data-ogsb] .dm-body { background: #161b22 !important; }
    [data-ogsc] .dm-text, [data-ogsb] .dm-text { color: #d0d4d9 !important; }
    [data-ogsc] .dm-text-strong, [data-ogsb] .dm-text-strong { color: #ffffff !important; }
    [data-ogsc] .dm-text-muted, [data-ogsb] .dm-text-muted { color: #8a9098 !important; }
    [data-ogsc] .dm-panel, [data-ogsb] .dm-panel { background: #112318 !important; border-color: #1e3a2a !important; }
    [data-ogsc] .dm-panel-headline, [data-ogsb] .dm-panel-headline { color: #ffffff !important; }
    [data-ogsc] .dm-panel-desc, [data-ogsb] .dm-panel-desc { color: #b8bdc4 !important; }
    [data-ogsc] .dm-list-text, [data-ogsb] .dm-list-text { color: #d0d4d9 !important; }
    [data-ogsc] .dm-list-text-strong, [data-ogsb] .dm-list-text-strong { color: #ffffff !important; }
    [data-ogsc] .dm-footer, [data-ogsb] .dm-footer { background: #1c222b !important; color: #8a9098 !important; }
    [data-ogsc] .dm-footer a, [data-ogsb] .dm-footer a { color: #b8bdc4 !important; }
  </style>
</head>
<body style="margin:0; padding:0; background:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; color:#1a1a1a; line-height:1.6;" class="dm-page">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-page" style="background:#f4f5f7; padding:32px 16px;">
  <tr>
    <td align="center">

      <!-- ╭─ wrapper ─╮ -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="dm-wrapper" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 24px rgba(10,18,36,0.06);">

        <!-- ╭─ hero (brand-color) ─╮ -->
        <tr>
          <td style="background:#0a1224; background-image:linear-gradient(135deg,#0a1224 0%,#0f1f3d 100%); padding:44px 40px 40px; text-align:center;">
            <div style="color:#ffffff; font-size:12px; font-weight:700; letter-spacing:5px; text-transform:uppercase; opacity:0.78; margin-bottom:24px;">LARINOVA</div>
            <div style="display:inline-block; padding:6px 14px; border-radius:999px; background:rgba(16,176,121,0.18); color:#34d8a0; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; border:1px solid rgba(16,176,121,0.32);">Alpha Access</div>
            <div style="color:#ffffff; font-size:30px; font-weight:600; line-height:1.25; margin-top:24px; letter-spacing:-0.5px;">Welcome aboard, Dr. ${name}.</div>
          </td>
        </tr>

        <!-- ╭─ body ─╮ -->
        <tr>
          <td class="dm-body" style="padding:36px 40px 32px;">

            <p class="dm-text" style="margin:0 0 18px; font-size:16px; color:#2a2a2a; line-height:1.7;">
              Hi Dr. ${name},
            </p>
            <p class="dm-text" style="margin:0 0 28px; font-size:16px; color:#2a2a2a; line-height:1.7;">
              9 PM, still typing up notes from a consult that ended at 3? That hour is what Larinova hands back to you. It's why I added you to the alpha personally — I want to learn what works (and what doesn't) directly from doctors like you.
            </p>

            <!-- alpha access panel -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-panel" style="background:#f0fdf6; border:1px solid #c7f0db; border-radius:10px; margin:0 0 32px;">
              <tr>
                <td style="padding:22px 24px;">
                  <div class="dm-panel-label" style="font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#10b079; margin-bottom:6px;">Your Alpha Access</div>
                  <div class="dm-panel-headline" style="font-size:18px; font-weight:600; color:#0a1224; margin-bottom:10px; letter-spacing:-0.2px;">30 days of Pro, on us.</div>
                  <div class="dm-panel-desc" style="font-size:14px; color:#3d4f56; line-height:1.65;">Unlimited consultations. Every feature unlocked — multilingual recording, instant SOAP notes, ICD-10 coding, prescriptions, and Helena, your AI assistant.</div>
                </td>
              </tr>
            </table>

            <!-- numbered next-steps (table-based, Gmail-safe) -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
              <tr>
                <td class="dm-list-row" style="padding:14px 0; border-bottom:1px solid #eef0f3;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="top" width="40" style="padding:0 14px 0 0; vertical-align:top;">
                        <div style="width:28px; height:28px; line-height:28px; border-radius:50%; background:#10b079; color:#ffffff; font-size:12px; font-weight:700; text-align:center;">1</div>
                      </td>
                      <td valign="top" class="dm-list-text" style="font-size:14px; color:#2a2a2a; line-height:1.6;">
                        <strong class="dm-list-text-strong" style="color:#0a1224; font-weight:600;">Set up your account in 30 seconds.</strong> Tap "Get Started" below — sign up with your email, and you're in.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="dm-list-row" style="padding:14px 0; border-bottom:1px solid #eef0f3;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="top" width="40" style="padding:0 14px 0 0; vertical-align:top;">
                        <div style="width:28px; height:28px; line-height:28px; border-radius:50%; background:#10b079; color:#ffffff; font-size:12px; font-weight:700; text-align:center;">2</div>
                      </td>
                      <td valign="top" class="dm-list-text" style="font-size:14px; color:#2a2a2a; line-height:1.6;">
                        <strong class="dm-list-text-strong" style="color:#0a1224; font-weight:600;">Record your first real consultation.</strong> Speak naturally in your patient's language. Larinova writes the SOAP note, the prescription, and the codes by the time they walk out.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="top" width="40" style="padding:0 14px 0 0; vertical-align:top;">
                        <div style="width:28px; height:28px; line-height:28px; border-radius:50%; background:#10b079; color:#ffffff; font-size:12px; font-weight:700; text-align:center;">3</div>
                      </td>
                      <td valign="top" class="dm-list-text" style="font-size:14px; color:#2a2a2a; line-height:1.6;">
                        <strong class="dm-list-text-strong" style="color:#0a1224; font-weight:600;">Tell us what's missing.</strong> Reply to this email any time. Bugs, ideas, frustrations — they all go straight to us.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 36px;">
              <tr>
                <td align="center">
                  <a href="${accessUrl}" style="display:inline-block; padding:14px 36px; background:#10b079; color:#ffffff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600; letter-spacing:0.2px; box-shadow:0 4px 12px rgba(16,176,121,0.3);">Get Started</a>
                </td>
              </tr>
            </table>

            <!-- personal hello note above the video -->
            <p class="dm-text" style="margin:8px 0 14px; font-size:14px; color:#3d4f56; line-height:1.6; text-align:center;">
              I recorded a quick hello — 40 seconds, just me saying thanks and what to try first.
            </p>

            <!-- video tile (composite thumbnail with baked-in play button) -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
              <tr>
                <td align="center">
                  <a href="${videoUrl}" style="display:block; text-decoration:none; line-height:0;">
                    <img src="${videoThumb}" alt="A quick hello from Gabriel" width="520" class="dm-video-thumb" style="display:block; width:100%; max-width:520px; height:auto; border-radius:12px; border:1px solid #eef0f3;" />
                  </a>
                  <div class="dm-text-muted" style="font-size:12px; color:#6a7681; margin-top:12px; letter-spacing:0.2px; line-height:1.4;">A quick hello from Gabriel · 40 sec</div>
                </td>
              </tr>
            </table>

            <!-- signoff -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-signoff-border" style="border-top:1px solid #eef0f3;">
              <tr>
                <td style="padding:28px 0 0;">
                  <p class="dm-text" style="margin:0 0 12px; font-size:14px; color:#2a2a2a; line-height:1.7;">If anything feels off — even a small thing — just hit reply. I'll be on the other side of every email. The next 30 days are yours to shape.</p>
                  <p class="dm-text" style="margin:0 0 16px; font-size:14px; color:#2a2a2a; line-height:1.7;">Welcome aboard.</p>
                  <div class="dm-text-strong" style="font-size:14px; color:#0a1224; font-weight:600;">— Gabriel</div>
                  <div class="dm-text-muted" style="font-size:12px; color:#6a7681; font-weight:500; margin-top:2px;">Founder, Larinova</div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ╭─ footer ─╮ -->
        <tr>
          <td class="dm-footer" style="padding:22px 40px; background:#f8fafc; border-top:1px solid #eef0f3; text-align:center; font-size:12px; color:#6a7681; line-height:1.5;">
            <strong style="color:#3d4f56;">Larinova</strong> — OPD assistant for Indian doctors<br />
            <a href="mailto:hello@larinova.com" style="color:#3d4f56; text-decoration:none;">hello@larinova.com</a>
            &nbsp;·&nbsp;
            <a href="https://larinova.com" style="color:#3d4f56; text-decoration:none;">larinova.com</a>
          </td>
        </tr>

      </table>
      <!-- ╰─ wrapper ─╯ -->

    </td>
  </tr>
</table>

</body>
</html>`;
}

// ─── Appointment Confirmation to Booker ────────────────────────────────────

export async function sendAppointmentConfirmation({
  to,
  bookerName,
  doctorName,
  clinicName,
  clinicAddress,
  appointmentDate,
  startTime,
  appointmentType,
  videoCallLink,
  googleCalendarUrl,
}: {
  to: string;
  bookerName: string;
  doctorName: string;
  clinicName: string;
  clinicAddress?: string | null;
  appointmentDate: string;
  startTime: string;
  appointmentType: "video" | "in_person";
  videoCallLink?: string | null;
  googleCalendarUrl: string;
}) {
  const locationLine =
    appointmentType === "video"
      ? videoCallLink
        ? `<p>Join via: <a href="${videoCallLink}">${videoCallLink}</a></p>`
        : `<p>Your doctor will send you the video call link.</p>`
      : `<p>Location: ${clinicAddress ?? clinicName}</p>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your appointment with ${doctorName} is confirmed`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Appointment Confirmed</h2>
        <p>Hi ${bookerName},</p>
        <p>Your appointment has been confirmed.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:6px;color:#6b7280;">Doctor</td><td style="padding:6px;font-weight:600;">${doctorName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Date</td><td style="padding:6px;">${appointmentDate}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Time</td><td style="padding:6px;">${startTime}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Type</td><td style="padding:6px;">${appointmentType === "video" ? "Video Call" : "In-Person Visit"}</td></tr>
        </table>
        ${locationLine}
        <a href="${googleCalendarUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">Add to Google Calendar</a>
        <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Powered by Larinova</p>
      </div>
    `,
  });
}

// ─── New Booking Notification to Doctor ────────────────────────────────────

export async function sendDoctorNewBookingNotification({
  to,
  doctorName,
  bookerName,
  bookerEmail,
  bookerPhone,
  bookerAge,
  bookerGender,
  reason,
  chiefComplaint,
  appointmentDate,
  startTime,
  appointmentType,
}: {
  to: string;
  doctorName: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  bookerAge: number;
  bookerGender: string;
  reason: string;
  chiefComplaint: string;
  appointmentDate: string;
  startTime: string;
  appointmentType: "video" | "in_person";
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `New appointment — ${bookerName}, ${appointmentDate} ${startTime}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>New Appointment Booked</h2>
        <p>Hi Dr. ${doctorName},</p>
        <p>A new appointment has been booked via your Larinova booking page.</p>
        <h3 style="margin-top:20px;">Appointment Details</h3>
        <table style="border-collapse:collapse;width:100%;margin:8px 0;">
          <tr><td style="padding:6px;color:#6b7280;">Date</td><td style="padding:6px;">${appointmentDate}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Time</td><td style="padding:6px;">${startTime}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Type</td><td style="padding:6px;">${appointmentType === "video" ? "Video Call" : "In-Person Visit"}</td></tr>
        </table>
        <h3 style="margin-top:20px;">Patient Information</h3>
        <table style="border-collapse:collapse;width:100%;margin:8px 0;">
          <tr><td style="padding:6px;color:#6b7280;">Name</td><td style="padding:6px;">${bookerName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Email</td><td style="padding:6px;">${bookerEmail}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Phone</td><td style="padding:6px;">${bookerPhone}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Age</td><td style="padding:6px;">${bookerAge}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Gender</td><td style="padding:6px;">${bookerGender}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Reason</td><td style="padding:6px;">${reason}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Chief Complaint</td><td style="padding:6px;">${chiefComplaint}</td></tr>
        </table>
        <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Powered by Larinova</p>
      </div>
    `,
  });
}
