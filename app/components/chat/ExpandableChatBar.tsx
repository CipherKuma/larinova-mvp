"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
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
import { useSidebar } from "@/components/layout/SidebarContext";
import {
  DocumentType,
  DOCUMENT_TYPES,
  HelenaMessage,
  HelenaConversation,
  HelenaDocument,
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

interface ExpandableChatBarProps {
  patientId?: string;
  patientName?: string;
}

export function ExpandableChatBar({
  patientId,
  patientName,
}: ExpandableChatBarProps) {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("chat");
  const tdt = useTranslations("documentTypes");

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // Load conversations
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
    if (isExpanded && showHistory) {
      loadConversations();
    }
  }, [isExpanded, showHistory, loadConversations]);

  // Load conversation messages
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

  // Start new conversation
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
          patient_id: patientId,
          document_type: selectedDocumentType,
          generate_document: !!selectedDocumentType,
          locale: locale === "id" ? "id" : "in",
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      // Update conversation ID
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

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

      // Reset document type after generating
      if (selectedDocumentType && data.document) {
        setSelectedDocumentType(null);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("errorResponseRetry"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
    setIsExpanded(false);
  };

  // Document type selector render function
  const renderDocumentTypeSelector = () => (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border-2 border-border rounded-xl shadow-md p-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">
          {t("generateDocument")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShowDocumentTypes(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
            className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all hover:bg-muted border ${
              selectedDocumentType === type
                ? "border-border bg-muted"
                : "border-transparent"
            }`}
          >
            <span className="text-lg">
              <info.icon className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {tdt(type as Parameters<typeof tdt>[0])}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Conversation history panel
  const renderHistoryPanel = () => (
    <div className="absolute inset-0 bg-card rounded-t-xl z-10 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">
          {t("conversationHistory")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHistory(false)}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={startNewConversation}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2 border-2 border-dashed border-border"
        >
          <Plus className="w-5 h-5 text-foreground" />
          <span className="font-medium text-foreground">
            {t("newConversation")}
          </span>
        </button>

        {conversations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t("noPreviousConversations")}
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left ${
                conversationId === conv.id ? "bg-muted" : ""
              }`}
            >
              <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {conv.title || t("untitled")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conv.created_at).toLocaleDateString()}
                  {conv.context?.patient?.name &&
                    ` • ${conv.context.patient.name}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );

  // Document artifact render function
  const renderDocumentArtifact = (document: {
    id: string;
    title: string;
    document_type: DocumentType;
  }) => {
    const docInfo = DOCUMENT_TYPES[document.document_type];
    const Icon = docInfo?.icon || FileText;
    return (
      <button
        onClick={() => handleDocumentClick(document.id)}
        className="mt-2 w-full flex items-center gap-3 p-3 bg-muted border-2 border-border rounded-xl hover:border-border hover:bg-muted transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-foreground truncate">
            {document.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {docInfo
              ? tdt(document.document_type as Parameters<typeof tdt>[0])
              : t("documentFallback")}
          </p>
        </div>
        <div className="flex items-center gap-1 text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-medium">{t("view")}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Clickable overlay to close chat */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out w-[95vw] sm:w-[500px] md:w-[550px] lg:w-[600px]"
        style={{
          height: isExpanded ? (isMobile ? "85vh" : "650px") : "auto",
        }}
      >
        {/* Background layer behind the chat */}
        <div
          className={`absolute inset-0 bg-card rounded-t-xl transition-opacity duration-500 -z-10 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        />

        {!isExpanded ? (
          // Collapsed button
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-card border border-border border-2 border-b-0 rounded-t-xl rounded-b-none px-6 py-3 flex items-center justify-between gap-4 transition-all duration-300 group shadow-md hover:shadow-md w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden group-hover:scale-110 transition-transform duration-300">
                <Image
                  src={sharedAsset("helena.png")}
                  alt={t("helenaName")}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-base text-foreground">
                {t("helenaName")}
              </span>
              {patientName && (
                <span className="text-sm text-muted-foreground">
                  • {patientName}
                </span>
              )}
            </div>
            <ChevronUp className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
          </button>
        ) : (
          // Expanded chat
          <div className="border-2 border-b-0 border-border rounded-t-xl rounded-b-none shadow-md flex flex-col h-full animate-in slide-in-from-bottom-4 fade-in duration-500 bg-card relative overflow-hidden">
            {/* History Panel Overlay */}
            {showHistory && renderHistoryPanel()}

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 bg-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={sharedAsset("helena.png")}
                    alt={t("helenaName")}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t("helenaName")}
                  </h3>
                  {patientName && (
                    <p className="text-xs text-muted-foreground">
                      {t("patientColon")} {patientName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(true)}
                  className="rounded-full hover:bg-muted"
                  title={t("conversationHistory")}
                >
                  <History className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-full hover:bg-muted"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border text-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}

                    {/* Document Artifact */}
                    {message.document &&
                      renderDocumentArtifact(message.document)}

                    <p
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      }`}
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
                  <div className="bg-secondary border border-border rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-foreground" />
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

            {/* Input */}
            <div className="p-4 border-t border-border flex-shrink-0 bg-card relative">
              {/* Document type selector popup */}
              {showDocumentTypes && renderDocumentTypeSelector()}

              {/* Selected document type indicator */}
              {selectedDocumentType && (
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("generating")}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground rounded-lg font-medium">
                    <span>
                      {(() => {
                        const Icon = DOCUMENT_TYPES[selectedDocumentType].icon;
                        return <Icon className="w-4 h-4" />;
                      })()}
                    </span>
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
                  className={`flex-shrink-0 ${
                    showDocumentTypes || selectedDocumentType
                      ? "border-foreground text-foreground"
                      : ""
                  }`}
                  title={t("generateDocument")}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
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
        )}
      </div>
    </>
  );
}
