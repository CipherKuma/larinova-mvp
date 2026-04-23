"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { VoiceAITester } from "@/components/voice-testing/VoiceAITester";

type AIProvider = "openai" | "deepgram" | "speechmatics" | "assemblyai";

export default function VoiceAITestingPage() {
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("speechmatics");
  const t = useTranslations("voiceAI");

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-display uppercase font-bold">
          {t("title")}
        </h1>
        <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-gray-600 mt-1 md:mt-2 uppercase">
          {t("description")}
        </p>
      </div>

      {/* Provider Selection */}
      <div className="border border-black bg-white p-3 md:p-4 lg:p-6">
        <div className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm uppercase text-gray-600 mb-2 md:mb-3">
          {t("selectProvider")}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <Button
            onClick={() => setSelectedProvider("speechmatics")}
            variant={
              selectedProvider === "speechmatics" ? "default" : "outline"
            }
            className="uppercase text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs"
          >
            {t("speechmatics")}
            <div className="text-[7px] md:text-[8px] lg:text-[9px] normal-case opacity-70">
              {t("arabicSupported")}
            </div>
          </Button>

          <Button
            onClick={() => setSelectedProvider("deepgram")}
            variant={selectedProvider === "deepgram" ? "default" : "outline"}
            className="uppercase text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs"
          >
            {t("deepgram")}
            <div className="text-[7px] md:text-[8px] lg:text-[9px] normal-case opacity-70">
              {t("arabicNotSupported")}
            </div>
          </Button>

          <Button
            onClick={() => setSelectedProvider("openai")}
            variant={selectedProvider === "openai" ? "default" : "outline"}
            className="uppercase text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs"
          >
            {t("openaiWhisper")}
            <div className="text-[7px] md:text-[8px] lg:text-[9px] normal-case opacity-70">
              {t("arabicSupported")}
            </div>
          </Button>

          <Button
            onClick={() => setSelectedProvider("assemblyai")}
            variant={selectedProvider === "assemblyai" ? "default" : "outline"}
            className="uppercase text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs"
          >
            {t("assemblyai")}
            <div className="text-[7px] md:text-[8px] lg:text-[9px] normal-case opacity-70">
              {t("arabicNotSupported")}
            </div>
          </Button>
        </div>
      </div>

      {/* Transcription Component */}
      <VoiceAITester provider={selectedProvider} />
    </div>
  );
}
