"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CodeGenerateModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/codes/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count, note: note.trim() || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "failed");
      setGenerated(body.codes);
      router.refresh();
    } catch (err) {
      alert(`Generation failed: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setGenerated(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>Generate codes</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate invite codes</DialogTitle>
        </DialogHeader>
        {generated ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generated {generated.length} codes:
            </p>
            <pre className="bg-muted rounded p-3 text-xs whitespace-pre-wrap">
              {generated.join("\n")}
            </pre>
            <Button
              onClick={() =>
                navigator.clipboard.writeText(generated.join("\n"))
              }
            >
              Copy all
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="count">Count (1–50)</Label>
              <Input
                id="count"
                type="text"
                inputMode="numeric"
                value={count}
                onChange={(e) =>
                  setCount(parseInt(e.target.value.replace(/\D/g, "")) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Pilot batch 2"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || count < 1 || count > 50}
            >
              {submitting ? "Generating…" : `Generate ${count} codes`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
