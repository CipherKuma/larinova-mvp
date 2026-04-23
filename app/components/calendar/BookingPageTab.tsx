"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BookingPageTabProps {
  initialHandle: string;
  appUrl: string;
}

export function BookingPageTab({ initialHandle, appUrl }: BookingPageTabProps) {
  const t = useTranslations("calendar.bookingPage");
  const [handle, setHandle] = useState(initialHandle);
  const [editHandle, setEditHandle] = useState(initialHandle);
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bookingUrl = `${appUrl}/book/${handle}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onHandleChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setEditHandle(clean);
    setHandleStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (clean === handle || clean.length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setHandleStatus("checking");
      const res = await fetch(`/api/calendar/handle?handle=${clean}`);
      const data = await res.json();
      setHandleStatus(data.available ? "available" : "taken");
    }, 500);
  };

  const saveHandle = async () => {
    if (handleStatus !== "available" && editHandle !== handle) return;
    setSaving(true);
    try {
      const res = await fetch("/api/calendar/handle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: editHandle }),
      });
      if (!res.ok) {
        toast.error("Failed to save handle");
        return;
      }
      setHandle(editHandle);
      setHandleStatus("idle");
      toast.success("Booking handle updated");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex gap-6 flex-col md:flex-row">
        {/* Left controls */}
        <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
          <div>
            <Label className="text-sm font-medium">{t("yourLink")}</Label>
            <div className="flex gap-2 mt-1">
              <Input value={bookingUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">{t("handle")}</Label>
            <div className="flex gap-2 mt-1 items-start">
              <div className="relative flex-1">
                <Input
                  value={editHandle}
                  onChange={(e) => onHandleChange(e.target.value)}
                  className="text-xs"
                  placeholder="dr-your-name"
                />
                {handleStatus !== "idle" && (
                  <div
                    className={`text-xs mt-1 ${
                      handleStatus === "available"
                        ? "text-green-600"
                        : handleStatus === "taken"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {handleStatus === "checking"
                      ? "Checking..."
                      : handleStatus === "available"
                        ? t("handleAvailable")
                        : t("handleTaken")}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                disabled={
                  saving ||
                  (handleStatus !== "available" && editHandle !== handle)
                }
                onClick={saveHandle}
              >
                {saving ? "..." : t("saveHandle")}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: iframe preview */}
        <div
          className="flex-1 border border-border rounded-xl overflow-hidden"
          style={{ height: 500 }}
        >
          <iframe
            src={bookingUrl}
            className="w-full h-full"
            title="Booking page preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}
