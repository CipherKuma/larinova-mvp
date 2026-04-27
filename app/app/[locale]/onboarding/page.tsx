"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ParticleDust } from "@/components/onboarding/ParticleDust";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepName } from "@/components/onboarding/StepName";
import { StepMotivation } from "@/components/onboarding/StepMotivation";
import { StepSpecialty } from "@/components/onboarding/StepSpecialty";
import { StepRegistration } from "@/components/onboarding/StepRegistration";
import { StepMagic } from "@/components/onboarding/StepMagic";
import { StepPrescription } from "@/components/onboarding/StepPrescription";
import { StepCelebration } from "@/components/onboarding/StepCelebration";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { useLocaleAsset, sharedAsset } from "@/lib/locale-asset";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [regData, setRegData] = useState<{
    degrees?: string;
    registrationNumber?: string;
    registrationCouncil?: string;
  }>({});
  const [doctorName, setDoctorName] = useState("Doctor");
  const [soapTranscript, setSoapTranscript] = useState("");
  const [soapNote, setSoapNote] = useState<Record<string, string> | null>(null);
  const savingRef = useRef(false);
  const locale = useLocale();
  const asset = useLocaleAsset();

  const stepImages: Record<number, { src: string; alt: string }> = {
    1: {
      // Step 1 (name) reuses the credentials/profile image — the visual
      // matches "tell us who you are" better than a blank slot.
      src: asset("onboarding/step5-registration.jpg"),
      alt: "Medical credentials verification",
    },
    2: {
      src: asset("onboarding/step1-motivation.jpg"),
      alt: "Doctor overwhelmed with paperwork",
    },
    3: {
      src: asset("onboarding/step2-specialty.jpg"),
      alt: "Medical professional with stethoscope",
    },
    4: {
      src: asset("onboarding/step3-demo.jpg"),
      alt: "Doctor using voice technology",
    },
    5: {
      src: asset("onboarding/step4-prescription.jpg"),
      alt: "Digital prescription generation",
    },
    6: {
      src: asset("onboarding/step5-registration.jpg"),
      alt: "Medical credentials verification",
    },
  };

  const totalSteps = 7;

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setDoctorName(
          user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Doctor",
        );
      }
    };
    fetchUser();
  }, []);

  const handleFinish = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = `/${locale}`;
        return;
      }

      // Persist specialty + locale; consume_invite_code RPC sets
      // onboarding_completed atomically alongside the invite consumption.
      const updateData = {
        specialization: specialty,
        locale: locale,
      };

      // Try update first — signup flow creates the doctor record
      const { data: updated, error: updateError } = await supabase
        .from("larinova_doctors")
        .update(updateData)
        .eq("user_id", user.id)
        .select("id");

      if (updateError || !updated?.length) {
        // No rows matched — record doesn't exist, insert it
        const { error: insertError } = await supabase
          .from("larinova_doctors")
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name ?? null,
            email: user.email!,
            ...updateData,
          });
        if (insertError) {
          console.error("Onboarding save failed:", insertError.message);
          savingRef.current = false;
          return;
        }
      }

      // Consume the invite code — this is the moment the code becomes
      // permanently used. Also sets onboarding_completed = true atomically.
      try {
        const consumeRes = await fetch("/api/invite/consume", {
          method: "POST",
        });
        if (!consumeRes.ok) {
          const body = await consumeRes.json().catch(() => ({}));
          console.error(
            "[onboarding] consume_invite_code failed:",
            body?.error,
          );
          // Fall back to flipping onboarding_completed manually so the user
          // isn't stuck — the invite-code state may need admin attention.
          await supabase
            .from("larinova_doctors")
            .update({ onboarding_completed: true })
            .eq("user_id", user.id);
        }
      } catch (err) {
        console.error("[onboarding] consume request failed:", err);
        await supabase
          .from("larinova_doctors")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      }

      window.location.href = `/${locale}`;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      savingRef.current = false;
    }
  }, [specialty, locale]);

  const isCelebration = step === 7;
  const currentImage = stepImages[step];

  return (
    <div className="h-screen relative overflow-hidden font-display">
      <ParticleDust />
      <ProgressBar step={step} totalSteps={totalSteps} />

      {isCelebration ? (
        /* Step 6: Full-width celebration */
        <div className="h-screen flex items-center justify-center">
          <div className="relative z-10 w-full py-12">
            <StepCelebration
              doctorName={doctorName}
              specialty={specialty}
              onComplete={handleFinish}
            />
          </div>
        </div>
      ) : (
        /* Steps 1-5: Split layout */
        <div className="h-screen grid grid-cols-1 lg:grid-cols-2 relative z-10">
          {/* Left column */}
          <div className="flex flex-col h-full min-h-0">
            {/* Logo — permanent top left */}
            <div className="flex-shrink-0 flex items-center gap-2.5 p-6 lg:p-8">
              <Image
                src={sharedAsset("larinova-icon.png")}
                alt="Larinova"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="font-display font-semibold text-foreground tracking-tight text-lg">
                Larinova
              </span>
            </div>

            {/* Back button */}
            {step >= 2 && (
              <button
                onClick={() => setStep(step - 1)}
                className="absolute top-7 right-6 lg:right-auto lg:left-[calc(50%-40px)] z-50 w-8 h-8 flex items-center justify-center rounded-full bg-muted/20 hover:bg-muted/40 transition-colors lg:hidden"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            )}

            {/* Form content — matches image padding so actions align with image bottom */}
            <div className="flex-1 min-h-0 flex flex-col px-6 lg:px-8 xl:px-12 pb-10 xl:pb-14">
              <div className="w-full max-w-xl flex-1 min-h-0 flex flex-col">
                {step === 1 && (
                  <StepName
                    onContinue={(fn, ln) => {
                      setDoctorName(`${fn} ${ln}`);
                      setStep(2);
                    }}
                  />
                )}
                {step === 2 && <StepMotivation onContinue={() => setStep(3)} />}
                {step === 3 && (
                  <StepSpecialty
                    onContinue={(s) => {
                      setSpecialty(s);
                      setStep(4);
                    }}
                    onBack={() => setStep(2)}
                  />
                )}
                {step === 4 && (
                  <StepMagic
                    onContinue={(transcript, soap) => {
                      if (transcript) setSoapTranscript(transcript);
                      if (soap) setSoapNote(soap);
                      setStep(5);
                    }}
                    onBack={() => setStep(3)}
                  />
                )}
                {step === 5 && (
                  <StepPrescription
                    doctorName={doctorName}
                    degrees={regData.degrees}
                    registrationNumber={regData.registrationNumber}
                    registrationCouncil={regData.registrationCouncil}
                    soapTranscript={soapTranscript}
                    soapNote={soapNote}
                    onContinue={() => setStep(6)}
                    onBack={() => setStep(4)}
                  />
                )}
                {step === 6 && (
                  <StepRegistration
                    onContinue={(data) => {
                      setRegData(data);
                      setStep(7);
                    }}
                    onBack={() => setStep(5)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right column: Step image */}
          {currentImage && (
            <div className="hidden lg:flex items-center justify-center p-6 xl:p-8">
              <div className="relative w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl aspect-[3/4] rounded-2xl overflow-hidden border border-border/20">
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/60 via-transparent to-transparent" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
