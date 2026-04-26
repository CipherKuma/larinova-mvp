"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewIssuePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "failed");
      router.push(`/${locale}/issues/${result.id}`);
    } catch (err) {
      alert(`Failed: ${(err as Error).message}`);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-24">
      <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">
        Report an issue
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            placeholder="e.g. Recording stops after 10 seconds"
            className="min-h-[44px] text-base md:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">Description</Label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={5000}
            placeholder="What happened? What did you expect to happen? Steps to reproduce, if any."
            className="w-full rounded-md border border-input bg-card px-3 py-3 text-base md:text-sm focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button
          type="submit"
          disabled={
            submitting || title.trim().length < 3 || body.trim().length < 1
          }
          className="w-full sm:w-auto min-h-[44px]"
        >
          {submitting ? "Submitting…" : "File issue"}
        </Button>
      </form>
    </div>
  );
}
