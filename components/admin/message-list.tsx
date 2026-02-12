"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Message {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
  filter: string;
  page: number;
  totalPages: number;
}

export function MessageList({ messages, filter, page, totalPages }: MessageListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleMarkRead(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Marked as read");
      router.refresh();
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Message deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        <Link
          href="/admin/messages"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/messages?filter=unread"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          Unread
        </Link>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No messages found.</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border border-border/50 p-4 transition-colors ${
                !msg.isRead ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{msg.name}</p>
                    {!msg.isRead && (
                      <Badge variant="default" className="text-xs">New</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {msg.email && <span>{msg.email}</span>}
                    {msg.phone && <span>{msg.phone}</span>}
                    <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-2">
                    {msg.message}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!msg.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkRead(msg.id)}
                      disabled={loadingId === msg.id}
                      title="Mark as read"
                    >
                      {loadingId === msg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MailOpen className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(msg.id)}
                    disabled={loadingId === msg.id}
                    title="Delete message"
                    className="text-destructive hover:text-destructive"
                  >
                    {loadingId === msg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={`/admin/messages?${filter !== "all" ? `filter=${filter}&` : ""}page=${page - 1}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/messages?${filter !== "all" ? `filter=${filter}&` : ""}page=${page + 1}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
