"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export function ListingRowActions({ id, slug, isPublished, isFeatured }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleField(field: "is_published" | "is_featured", value: boolean) {
    setLoading(true);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <div className="flex gap-1.5">
        <a
          href={`/listings/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
        >
          View Listing
        </a>
        <Link
          href={`/admin/listings/${id}`}
          className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
        >
          Edit Listing
        </Link>
      </div>
      <button
        onClick={() => toggleField("is_published", !isPublished)}
        disabled={loading}
        className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border transition-colors disabled:opacity-50 ${
          isPublished
            ? "border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500"
            : "border-green-400 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500"
        }`}
      >
        {loading ? "…" : isPublished ? "Inactivate" : "Activate"}
      </button>
    </div>
  );
}
