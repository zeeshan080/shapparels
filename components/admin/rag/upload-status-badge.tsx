"use client";

import { Badge } from "@/components/ui/badge";

interface UploadStatusBadgeProps {
  status: "processing" | "ready" | "error";
}

export function UploadStatusBadge({ status }: UploadStatusBadgeProps) {
  switch (status) {
    case "ready":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          Processing
        </Badge>
      );
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
