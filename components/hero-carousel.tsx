"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, CameraIcon } from "@/components/icons";

interface CarouselImage {
  url: string;
  caption?: string | null;
}

interface HeroCarouselProps {
  images: CarouselImage[];
  name: string;
}

export function HeroCarousel({ images, name }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  if (total === 0) {
    return (
      <div className="relative w-full h-[65vh] bg-gradient-to-br from-navy to-navy-mid" />
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div className="relative w-full h-[65vh] bg-navy overflow-hidden">
      {images.map((img, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <Image
            src={img.url}
            alt={img.caption ?? `${name} image ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Subtle bottom gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent pointer-events-none" />

      {total > 1 && (
        <>
          {/* Left arrow */}
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-colors"
          >
            <ChevronLeftIcon size={20} className="text-navy" />
          </button>

          {/* Right arrow */}
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-colors"
          >
            <ChevronRightIcon size={20} className="text-navy" />
          </button>

          {/* Photo counter badge */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5">
            <CameraIcon size={13} className="text-white" />
            <span className="font-mono text-[11px] text-white tracking-wider">
              {current + 1} / {total}
            </span>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  i === current ? "bg-white w-4" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
