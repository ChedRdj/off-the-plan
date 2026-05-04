"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface Category {
  label: string;
  href: string;
  image: string;
}

function ArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.firstElementChild as HTMLElement | null;
    const gap = 16;
    const step = item ? item.offsetWidth + gap : 300;
    track.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <p className="font-mono text-[13px] uppercase tracking-widest text-ink">
          Search by Category
        </p>

        {/* Luxury circular arrow buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll("prev")}
            aria-label="Previous"
            className={cn(
              "w-12 h-12 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 bg-transparent",
              "hover:bg-orange hover:border-orange hover:text-white",
              "transition-all duration-300 ease-out",
              "disabled:opacity-20 disabled:cursor-not-allowed",
            )}
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => scroll("next")}
            aria-label="Next"
            className={cn(
              "w-12 h-12 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 bg-transparent",
              "hover:bg-orange hover:border-orange hover:text-white",
              "transition-all duration-300 ease-out",
              "disabled:opacity-20 disabled:cursor-not-allowed",
            )}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Carousel — overflow wrapper clips the scrollbar */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="flex-shrink-0 snap-start w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
            >
              <Link href={cat.href} className="group relative block h-72 overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-navy/10 group-hover:from-navy/60 group-hover:via-navy/15 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white drop-shadow">
                    {cat.label}
                  </span>
                  <span
                    className="block h-px bg-white/50 transition-all duration-500 w-6 group-hover:w-12"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
