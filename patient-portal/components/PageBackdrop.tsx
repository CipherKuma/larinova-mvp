/**
 * Subtle ambient background:
 *   - radial emerald glow anchored top-right
 *   - faint dotted grid that fades out
 * Sits behind every authed page so content is never floating in pure black.
 */
export default function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.13) 0%, rgba(16,185,129,0.04) 40%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[600px] opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
        }}
      />
    </div>
  );
}
