"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  variant?: "page" | "widget";
  role?: "user" | "admin";
  title?: string;
  emptyMessage?: string;
}

export function ChatInterface({
  variant = "page",
  role = "user",
  title,
  emptyMessage,
}: ChatInterfaceProps) {
  const { messages, isLoading, sendMessage, stopGenerating, clearChat } =
    useChat(role);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const headerTitle =
    title ?? (role === "admin" ? "Admin Assistant" : "SH Apparels Assistant");
  const empty =
    emptyMessage ??
    (role === "admin"
      ? "Ask me to manage products, orders, categories, or look up stats."
      : "Ask me about products, orders, shipping, or returns.");

  return (
    <div
      className={cn(
        "flex flex-col",
        variant === "page" ? "h-[calc(100vh-4rem)]" : "h-full"
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{headerTitle}</h2>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <p className="text-sm">{empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <ChatInput
          onSend={sendMessage}
          onStop={stopGenerating}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
