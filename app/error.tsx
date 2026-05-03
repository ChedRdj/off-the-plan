"use client";

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-label-sm uppercase tracking-widest text-orange mb-4">
          Something went wrong
        </p>
        <h1 className="font-display font-light text-navy text-section-lg mb-4">
          An unexpected error occurred
        </h1>
        <p className="font-sans text-body-md text-ink/60 mb-8">
          We couldn't load this page. Try refreshing, or head back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
