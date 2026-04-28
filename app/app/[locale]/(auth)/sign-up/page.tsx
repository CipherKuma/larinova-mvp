"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/src/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";
import { sharedAsset } from "@/lib/locale-asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

type SignUpFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
};

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const supabase = createClient();

  const signUpSchema = z.object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: t("auth.firstNameRequired") })
      .max(60),
    lastName: z
      .string()
      .trim()
      .min(1, { message: t("auth.lastNameRequired") })
      .max(60),
    email: z
      .string()
      .min(1, { message: t("auth.emailRequired") })
      .email({ message: t("auth.invalidEmail") }),
    phoneNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
        message: t("auth.invalidPhoneNumber"),
      }),
  });

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  // If the visitor arrived via an invite (cookie set by /api/invite/validate),
  // pre-fill First / Last / Email from what the admin recorded at invite-time.
  // Fields stay editable — admin typos are correctable here.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/invite/details", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled || !d?.ok) return;
        if (d.firstName) form.setValue("firstName", d.firstName);
        if (d.lastName) form.setValue("lastName", d.lastName);
        if (d.email) form.setValue("email", d.email);
      } catch {
        // No cookie or fetch failed — form stays empty, doctor types manually.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);

    try {
      // 1. Server creates the auth user (no password) + doctor row.
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phoneNumber: data.phoneNumber,
        }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        if (result.errorType === "USER_ALREADY_EXISTS") {
          toast.error(t("auth.accountAlreadyExists"), {
            description: t("auth.accountExistsSignIn"),
          });
          setLoading(false);
          setTimeout(() => router.push("/sign-in"), 2000);
          return;
        }
        toast.error(t("auth.signUpFailed"), {
          description: result.error || t("auth.unableToCreateAccount"),
        });
        setLoading(false);
        return;
      }

      // 2. Send the email OTP. shouldCreateUser:false because the user was
      // just created by the API — Supabase will issue an OTP to the existing
      // (already confirmed) account.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });
      if (otpError) {
        toast.error(t("auth.failedToSendLink"), {
          description: otpError.message,
        });
        setLoading(false);
        return;
      }

      // 3. Hand off to the verify-otp page. Email mode.
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      console.error("[SIGNUP-UI] Unexpected error during signup:", error);
      toast.error(t("auth.unexpectedError"), {
        description: t("auth.unexpectedErrorOccurred"),
      });
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          <Image
            src={sharedAsset("larinova-icon.png")}
            alt="Larinova"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <span className="font-display font-semibold text-foreground tracking-tight text-2xl">
            Larinova
          </span>
        </div>
      </div>

      <div className="w-16 h-px bg-muted-foreground/30 mx-auto mb-8" />

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {t("auth.createYourAccount")}
        </h2>
        <p className="text-muted-foreground">{t("auth.getStarted")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t("auth.firstName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("auth.firstName")}
                      autoComplete="given-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t("auth.lastName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("auth.lastName")}
                      autoComplete="family-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t("auth.email")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("auth.email")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t("auth.phoneNumber")}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({t("common.optional")})
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      +91
                    </div>
                    <Input
                      type="text"
                      inputMode="tel"
                      placeholder="9876543210"
                      {...field}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(v.slice(0, 10));
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? t("common.loading") : t("auth.signUp")}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
