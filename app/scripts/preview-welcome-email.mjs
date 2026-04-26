// Preview the alpha welcome email locally. Renders the HTML, copies the
// composite video thumbnail to ./preview-out/, and serves on a port the M2
// worker can hit over Tailscale.
//
// Usage:  node scripts/preview-welcome-email.mjs [firstName] [port]

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// Inline the same generator from lib/resend/email.ts so we don't have to
// transpile TS for the preview. Keep this in sync with the real template.
const firstName = process.argv[2] || "Gabriel";
const port = Number(process.argv[3] || 7711);

function escHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Read the template directly out of the source file so we never drift.
const emailSrc = fs.readFileSync(
  path.join(repoRoot, "lib/resend/email.ts"),
  "utf8",
);
const fnMatch = emailSrc.match(
  /function generateAlphaWelcomeHtml\([\s\S]*?return `([\s\S]*?)`;\s*\n\}/,
);
if (!fnMatch) {
  console.error("Could not extract generateAlphaWelcomeHtml from email.ts");
  process.exit(1);
}
let html = fnMatch[1]
  .replace(/\$\{name\}/g, escHtml(firstName))
  .replace(/\$\{dashboardUrl\}/g, "https://app.larinova.com")
  .replace(/\$\{videoUrl\}/g, "https://www.youtube.com/watch?v=XA01CrBcoq0")
  .replace(/\$\{videoThumb\}/g, "/welcome-video-thumb.png");

const thumbBytes = fs.readFileSync(
  path.join(repoRoot, "public/email/welcome-video-thumb.png"),
);

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url?.startsWith("/?")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } else if (req.url === "/welcome-video-thumb.png") {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(thumbBytes);
  } else {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`preview server: http://0.0.0.0:${port}/`);
  console.log(`tailscale URL : http://100.100.148.117:${port}/`);
});
