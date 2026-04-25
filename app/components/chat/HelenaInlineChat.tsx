"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  Send,
  Loader2,
  FileText,
  Plus,
  History,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";
import { sharedAsset } from "@/lib/locale-asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DocumentType,
  DOCUMENT_TYPES,
  HelenaMessage,
  HelenaConversation,
} from "@/types/helena";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  document?: {
    id: string;
    title: string;
    document_type: DocumentType;
  } | null;
}

export function HelenaInlineChat() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("chat");
  const tdt = useTranslations("documentTypes");

  const [showDocumentTypes, setShowDocumentTypes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<HelenaConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: t("helenaGreeting"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/helena/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  useEffect(() => {
    if (showHistory) {
      loadConversations();
    }
  }, [showHistory, loadConversations]);

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(
        `/api/helena/conversations/${convId}/messages`,
      );
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map(
          (m: HelenaMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
            document: m.document
              ? {
                  id: m.document.id,
                  title: m.document.title,
                  document_type: m.document.document_type as DocumentType,
                }
              : null,
          }),
        );
        if (loadedMessages.length === 0) {
          loadedMessages.push({
            id: "1",
            role: "assistant",
            content: t("helenaGreetingShort"),
            timestamp: new Date(),
          });
        }
        setMessages(loadedMessages);
        setConversationId(convId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: t("helenaGreeting"),
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
    setSelectedDocumentType(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/helena/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId,
          document_type: selectedDocumentType,
          generate_document: !!selectedDocumentType,
          locale: locale === "id" ? "id" : "in",
        }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      if (data.conversation_id) setConversationId(data.conversation_id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || t("errorResponse"),
        timestamp: new Date(),
        document: data.document
          ? {
              id: data.document.id,
              title: data.document.title,
              document_type: data.document.document_type,
            }
          : null,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (selectedDocumentType && data.document) setSelectedDocumentType(null);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t("errorResponseRetry"),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDocumentClick = (documentId: string) => {
    router.push(`/${locale}/documents/${documentId}`);
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image
              src={sharedAsset("helena.png")}
              alt={t("helenaName")}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {t("helenaName")}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-full hover:bg-muted h-8 w-8"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={startNewConversation}
            className="rounded-full hover:bg-muted h-8 w-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute inset-0 bg-card z-10 flex flex-col rounded-2xl">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">
              {t("conversationHistory")}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(false)}
              className="h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            <button
              onClick={startNewConversation}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2 border-2 border-dashed border-border"
            >
              <Plus className="w-4 h-4 text-foreground" />
              <span className="font-medium text-foreground text-sm">
                {t("newConversation")}
              </span>
            </button>
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {t("noPreviousConversations")}
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left ${conversationId === conv.id ? "bg-muted" : ""}`}
                >
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">
                      {conv.title || t("untitled")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.created_at).toLocaleDateString()}
                      {conv.context?.patient?.name &&
                        ` · ${conv.context.patient.name}`}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                </button>
              ))
            )}
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-foreground"}`}
              >
                {message.role === "assistant" ? (
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
                {message.document && (
                  <button
                    onClick={() => handleDocumentClick(message.document!.id)}
                    className="mt-2 w-full flex items-center gap-2 p-2 bg-muted border border-border rounded-xl hover:bg-muted/80 transition-all group"
                  >
                    <FileText className="w-4 h-4 text-foreground" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-foreground truncate text-xs">
                        {message.document.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tdt(
                          message.document.document_type as Parameters<
                            typeof tdt
                          >[0],
                        ) || t("documentFallback")}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                )}
                <p
                  className={`text-xs mt-1 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary border border-border rounded-2xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedDocumentType
                      ? t("generatingDocument")
                      : t("thinking")}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border flex-shrink-0 relative">
        {showDocumentTypes && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                {t("generateDocument")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowDocumentTypes(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(
                Object.entries(DOCUMENT_TYPES) as [
                  DocumentType,
                  (typeof DOCUMENT_TYPES)[DocumentType],
                ][]
              ).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedDocumentType(type);
                    setShowDocumentTypes(false);
                    inputRef.current?.focus();
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all hover:bg-muted border ${selectedDocumentType === type ? "border-border bg-muted" : "border-transparent"}`}
                >
                  <info.icon className="w-3 h-3" />
                  <span className="font-medium text-foreground truncate">
                    {tdt(type as Parameters<typeof tdt>[0])}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDocumentType && (
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t("generating")}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-lg font-medium">
              {(() => {
                const Icon = DOCUMENT_TYPES[selectedDocumentType].icon;
                return <Icon className="w-3 h-3" />;
              })()}
              {tdt(selectedDocumentType as Parameters<typeof tdt>[0])}
              <button
                onClick={() => setSelectedDocumentType(null)}
                className="ml-1 hover:text-foreground/70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDocumentTypes(!showDocumentTypes)}
            className={`flex-shrink-0 h-9 w-9 ${showDocumentTypes || selectedDocumentType ? "border-foreground text-foreground" : ""}`}
            title={t("generateDocument")}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              selectedDocumentType
                ? t("describeDocumentPlaceholder", {
                    label: tdt(
                      selectedDocumentType as Parameters<typeof tdt>[0],
                    ).toLowerCase(),
                  })
                : t("askPlaceholder")
            }
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-9 w-9"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
