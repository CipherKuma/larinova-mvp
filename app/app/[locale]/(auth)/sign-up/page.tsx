"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

// Note: Zod error messages will be overridden by FormMessage component translations
const signUpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
      message: "Invalid Indian phone number",
    }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);

    try {
      console.log("[SIGNUP-UI] Starting sign up process for:", data.email);

      // Call server-side API to handle signup
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
        }),
      });

      const result = await response.json();

      console.log("[SIGNUP-UI] API Response:", {
        ok: response.ok,
        status: response.status,
        hasError: !!result.error,
        errorType: result.errorType,
      });

      if (!response.ok || result.error) {
        console.log("[SIGNUP-UI] Signup failed (expected error):", {
          errorType: result.errorType,
          error: result.error,
        });

        // Handle specific error types
        if (result.errorType === "USER_ALREADY_EXISTS") {
          console.log(
            "[SIGNUP-UI] User already exists, redirecting to sign-in",
          );

          toast({
            title: t("auth.accountAlreadyExists"),
            description: t("auth.accountExistsSignIn"),
            variant: "destructive",
          });

          setLoading(false);

          // Redirect to sign-in page after a short delay
          setTimeout(() => {
            router.push("/sign-in");
          }, 2000);

          return;
        }

        // Other errors - show toast
        toast({
          title: t("auth.signUpFailed"),
          description: result.error || t("auth.unableToCreateAccount"),
          variant: "destructive",
        });

        setLoading(false);
        return;
      }

      console.log("[SIGNUP-UI] Sign up successful, attempting auto sign-in");

      // Sign in the user after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.log(
          "[SIGNUP-UI] Auto sign-in failed after signup (expected):",
          {
            message: signInError.message,
            status: signInError.status,
            code: (signInError as any).code,
          },
        );

        // Check if it's an email confirmation error
        if (
          signInError.message?.toLowerCase().includes("email not confirmed") ||
          signInError.message?.toLowerCase().includes("email confirmation") ||
          signInError.message?.toLowerCase().includes("verify")
        ) {
          console.log("[SIGNUP-UI] Email verification required");

          toast({
            title: t("auth.accountCreatedVerifyEmail"),
            description: t("auth.checkInboxToVerify"),
            variant: "default",
          });

          setLoading(false);
          // Don't redirect - let them see the message
          return;
        }

        // Other sign-in errors - redirect to sign-in page
        console.log(
          "[SIGNUP-UI] Other sign-in error, redirecting to sign-in page",
        );

        toast({
          title: t("auth.accountCreated"),
          description: t("auth.accountCreatedSignIn"),
        });

        setLoading(false);
        router.push("/sign-in");
        return;
      }

      console.log(
        "[SIGNUP-UI] Auto sign-in successful, redirecting to home page",
      );

      toast({
        title: t("auth.welcomeSignUp"),
        description: t("auth.accountCreatedSuccessfully"),
      });

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (error: unknown) {
      // Only truly unexpected errors reach here now
      console.log("[SIGNUP-UI] Unexpected error during signup:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      toast({
        title: t("auth.unexpectedError"),
        description: t("auth.unexpectedErrorOccurred"),
        variant: "destructive",
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
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t("auth.fullName")}
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("auth.fullName")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {t("auth.password")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth.password")}
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
