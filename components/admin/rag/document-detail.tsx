"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadStatusBadge } from "./upload-status-badge";
import type { DocumentDetail as DocumentDetailType } from "@/lib/ai/types";

interface DocumentDetailProps {
  document: DocumentDetailType;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentDetail({ document }: DocumentDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{document.documentName}</span>
            <UploadStatusBadge status={document.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium uppercase">{document.fileType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{formatFileSize(document.fileSize)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Chunks</p>
              <p className="font-medium">{document.totalChunks}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">{formatDate(document.uploadedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Chunks ({document.chunks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {document.chunks.map((chunk, index) => (
                <div key={chunk.chunkIndex}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Chunk {chunk.chunkIndex + 1}
                    </Badge>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {chunk.chunkText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
