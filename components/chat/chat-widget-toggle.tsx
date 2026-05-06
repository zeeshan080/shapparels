"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";

interface ChatWidgetToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatWidgetToggle({ isOpen, onClick }: ChatWidgetToggleProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      size="icon"
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
    </Button>
  );
}
