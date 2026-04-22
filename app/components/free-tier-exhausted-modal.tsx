"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limit: number;
  used: number;
}

export default function FreeTierExhaustedModal({
  open,
  onOpenChange,
  limit,
  used,
}: Props) {
  const locale = useLocale();
  const router = useRouter();

  const goToBilling = () => {
    router.push(`/${locale}/settings/billing`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You&apos;ve reached your free tier limit</DialogTitle>
          <DialogDescription>
            You&apos;ve completed {used} of {limit} consultations this month on
            the free plan. Upgrade to Pro for unlimited consultations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            I&apos;ll upgrade later
          </Button>
          <Button onClick={goToBilling}>Upgrade to Pro</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
