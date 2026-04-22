import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline — Larinova",
};

export default function OfflinePage() {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#0b0b0f",
          color: "#f5f5f7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          />
        </div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 600,
            margin: "0 0 0.5rem",
            letterSpacing: "-0.01em",
          }}
        >
          You&apos;re offline
        </h1>
        <p
          style={{
            color: "rgba(245,245,247,0.6)",
            maxWidth: 380,
            margin: 0,
            fontSize: "0.95rem",
            lineHeight: 1.5,
          }}
        >
          Reconnect to continue. Larinova needs an internet connection to record
          consults and sync with your patient records.
        </p>
      </body>
    </html>
  );
}
