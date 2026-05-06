"use client";

import { useState } from "react";
import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UploadStatusBadge } from "./upload-status-badge";
import { DeleteDocumentDialog } from "./delete-document-dialog";
import type { DocumentMetadata } from "@/lib/ai/types";

interface DocumentListItemProps {
  document: DocumentMetadata;
  onDelete: (id: string) => Promise<void>;
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

export function DocumentListItem({ document, onDelete }: DocumentListItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(document.documentId);
      setShowDelete(false);
    } catch {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <Link
            href={`/admin/ai-chat/${document.documentId}`}
            className="hover:underline"
          >
            {document.documentName}
          </Link>
        </TableCell>
        <TableCell className="uppercase">{document.fileType}</TableCell>
        <TableCell>{formatFileSize(document.fileSize)}</TableCell>
        <TableCell>{document.totalChunks}</TableCell>
        <TableCell>{formatDate(document.uploadedAt)}</TableCell>
        <TableCell>
          <UploadStatusBadge status={document.status} />
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDelete(true)}
          >
            Delete
          </Button>
        </TableCell>
      </TableRow>
      <DeleteDocumentDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        documentName={document.documentName}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
