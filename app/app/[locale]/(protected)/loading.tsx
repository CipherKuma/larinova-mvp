export default function ProtectedRouteLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 rounded-xl bg-muted/70 md:h-20" />
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-muted/60" />
          <div className="h-14 rounded-xl bg-muted/50" />
          <div className="h-14 rounded-xl bg-muted/40" />
          <div className="h-14 rounded-xl bg-muted/30" />
        </div>
        <div className="hidden space-y-3 md:block">
          <div className="h-28 rounded-xl bg-muted/50" />
          <div className="h-28 rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
