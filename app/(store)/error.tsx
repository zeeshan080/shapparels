"use client";

import { Button } from "@/components/ui/button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-destructive">
        Error
      </p>
      <h2 className="mt-2 font-serif text-2xl font-bold">
        Something went wrong
      </h2>
      <p className="mt-4 max-w-md text-muted-foreground">
        We encountered an unexpected error. Please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
