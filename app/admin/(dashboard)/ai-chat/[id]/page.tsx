"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DocumentDetail } from "@/components/admin/rag/document-detail";
import type { DocumentDetail as DocumentDetailType } from "@/lib/ai/types";

export default function AdminDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [document, setDocument] = useState<DocumentDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load document");
        }
        return res.json();
      })
      .then((data) => setDocument(data.document))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ai-chat">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Chat
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-center py-8 text-destructive">{error}</p>
      ) : document ? (
        <DocumentDetail document={document} />
      ) : null}
    </div>
  );
}
