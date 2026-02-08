"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="font-serif text-2xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground">An error occurred in the admin panel.</p>
      <Button className="mt-4" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
