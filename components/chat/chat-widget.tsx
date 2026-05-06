"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChatInterface } from "./chat-interface";
import { ChatWidgetToggle } from "./chat-widget-toggle";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[calc(100vw-3rem)] max-w-[400px] flex-col overflow-hidden p-0 shadow-xl">
          <ChatInterface variant="widget" role="user" />
        </Card>
      )}
      <ChatWidgetToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
    </>
  );
}
