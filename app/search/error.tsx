"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SearchError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-label-sm uppercase tracking-widest text-orange mb-4">Error</p>
        <h2 className="font-display font-light text-navy text-section-md mb-4">
          Couldn't load listings
        </h2>
        <p className="font-sans text-body-md text-ink/60 mb-8">
          There was a problem fetching the listings. Please try again.
        </p>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
