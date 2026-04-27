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
import { toast } from "sonner";

type Result = { code: string; sentTo: string; emailDelivered: boolean } | null;

export function InviteDoctorModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result>(null);

  function reset() {
    setFirst("");
    setLast("");
    setEmail("");
    setResult(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/codes/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "failed");
      setResult(body);
      router.refresh();
      if (body.emailDelivered) {
        toast.success(`Invite sent to ${body.sentTo}`);
      } else {
        toast.warning(
          `Code created (${body.code}) but email delivery may have failed. Check Resend logs.`,
        );
      }
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Invite a doctor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a doctor</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite sent to <strong>{result.sentTo}</strong>.
            </p>
            <div className="bg-muted rounded p-3 text-xs">
              <div className="text-muted-foreground mb-1">Code</div>
              <div className="font-mono text-sm">{result.code}</div>
            </div>
            {!result.emailDelivered && (
              <p className="text-sm text-amber-600">
                Email may not have been delivered — check Resend logs and resend
                manually if needed.
              </p>
            )}
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first">First name</Label>
                <Input
                  id="first"
                  value={firstName}
                  onChange={(e) => setFirst(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <Label htmlFor="last">Last name</Label>
                <Input
                  id="last"
                  value={lastName}
                  onChange={(e) => setLast(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.ramesh@example.com"
                autoComplete="email"
              />
            </div>
            <Button
              type="submit"
              disabled={
                submitting ||
                firstName.trim().length === 0 ||
                lastName.trim().length === 0 ||
                !email.trim().includes("@")
              }
            >
              {submitting ? "Sending…" : "Generate code & send invite"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
