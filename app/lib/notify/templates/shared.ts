import type { Locale } from "../types";

export function escHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailShell(title: string, inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(
    title,
  )}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;">
<div style="max-width:620px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <div style="background:#0a0a0a;padding:24px 32px;">
    <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Larinova</div>
    <div style="color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">${escHtml(title)}</div>
  </div>
  <div style="padding:28px 32px;line-height:1.65;font-size:14px;">${inner}</div>
  <div style="padding:18px 32px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa;">
    <strong style="color:#666;">Larinova — OPD Assistant for Indian Doctors</strong><br>
    Your medical data is encrypted and private · larinova.com
  </div>
</div>
</body></html>`;
}

/**
 * Templates are English-only for v1 (locale='in'). We accept a locale
 * parameter so Indonesia can add strings later without a refactor.
 */
export function withLocale<T>(
  locale: Locale | undefined,
  pick: Record<Locale, T>,
): T {
  const l = locale ?? "in";
  return pick[l] ?? pick.in;
}
