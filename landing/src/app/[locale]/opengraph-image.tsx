import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string }> };

export default async function OgImage({ params }: Props) {
  const { locale } = await params;
  const isId = locale === "id";

  const tagline = isId
    ? "Platform OPD untuk Dokter Indonesia"
    : "OPD Platform for Indian Doctors";

  const sub = isId
    ? "Booking · Intake · Prep · Konsultasi · Tindak Lanjut — Indonesia, Jawa, Inggris"
    : "Booking · Intake · Prep · Consult · Follow-up — Tamil, Hindi, English";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0f1e 0%, #111827 50%, #0a0f1e 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width="64"
          height="64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="3"
            y="12"
            width="2"
            height="8"
            rx="1"
            fill="#10b981"
            opacity="0.5"
          />
          <rect
            x="6.5"
            y="9"
            width="2"
            height="14"
            rx="1"
            fill="#10b981"
            opacity="0.7"
          />
          <rect
            x="10"
            y="6"
            width="2"
            height="20"
            rx="1"
            fill="#10b981"
            opacity="0.9"
          />
          <path
            d="M14 6v20M14 16l10-10M14 16l10 10"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f9fafb",
            letterSpacing: -1,
          }}
        >
          Larinova<span style={{ color: "#10b981" }}>AI</span>
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: 28,
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.4,
        }}
      >
        {tagline}
      </p>

      {/* Sub tagline */}
      <p
        style={{
          fontSize: 18,
          color: "#64748b",
          marginTop: 12,
        }}
      >
        {sub}
      </p>
    </div>,
    { ...size },
  );
}
