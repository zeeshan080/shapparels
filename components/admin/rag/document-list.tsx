"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentListItem } from "./document-list-item";
import type { DocumentMetadata } from "@/lib/ai/types";

interface DocumentListProps {
  documents: DocumentMetadata[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentList({
  documents,
  isLoading,
  onDelete,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No documents uploaded yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload a PDF, TXT, or DOCX file to get started
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Chunks</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <DocumentListItem
            key={doc.documentId}
            document={doc}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
