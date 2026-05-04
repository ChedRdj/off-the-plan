"use client";

import { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SliderItem {
  label: string;
  href: string;
  image: string;
}

// Full loop duration in seconds — matches the keyframe animation
const DURATION = 28;

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

export function ImageAutoSlider({
  items,
  tileHeight = "h-72",
}: {
  items: SliderItem[];
  tileHeight?: string;
}) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);

  // ─── Hover: pause / resume ───────────────────────────────────────────────
  const onEnter = () => {
    hoveredRef.current = true;
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  };

  const onLeave = () => {
    hoveredRef.current = false;
    if (trackRef.current) trackRef.current.style.animationPlayState = "running";
  };

  // ─── Arrow: freeze → slide one tile → re-attach animation ───────────────
  const skip = (dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    // 1. Read current animated position (pixels)
    const currentX = new DOMMatrix(getComputedStyle(track).transform).m41;

    // 2. Detach animation, pin at current position
    track.style.animation = "none";
    track.style.transform = `translateX(${currentX}px)`;

    // 3. Force reflow so the browser sees the new transform before the transition
    void track.offsetWidth;

    // 4. Slide one tile (256 px + 16 px gap = 272 px)
    const step = 272;
    const targetX = currentX + (dir === "next" ? -step : step);
    track.style.transition = "transform 0.55s cubic-bezier(0.16,1,0.3,1)";
    track.style.transform  = `translateX(${targetX}px)`;

    // 5. After transition settles, re-attach CSS animation from the target position
    setTimeout(() => {
      const half = track.scrollWidth / 2;

      // Normalise targetX into [0 .. -half)
      let pos = targetX % -half;
      if (pos > 0)    pos -= half;
      if (pos <= -half) pos += half;

      // Negative delay = start this many seconds into the animation
      const delay = -((Math.abs(pos) / half) * DURATION);

      track.style.transition = "none";
      track.style.transform  = "";
      track.style.animation  =
        `slider-scroll ${DURATION}s ${delay}s linear infinite`;
      track.style.animationPlayState = hoveredRef.current ? "paused" : "running";
    }, 580);
  };

  const strip = [...items, ...items];

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 flex items-center justify-between mb-8">
        <p className="font-mono text-[13px] uppercase tracking-widest text-ink">
          Search by Category
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip("prev")}
            aria-label="Previous"
            className={cn(
              "w-12 h-12 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 hover:bg-orange hover:border-orange hover:text-white",
              "transition-all duration-300 ease-out",
            )}
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => skip("next")}
            aria-label="Next"
            className={cn(
              "w-12 h-12 rounded-full border border-ink/25 flex items-center justify-center",
              "text-ink/60 hover:bg-orange hover:border-orange hover:text-white",
              "transition-all duration-300 ease-out",
            )}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* ─── Strip ──────────────────────────────────────────────────────── */}
      <div
        className="w-full overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <div
          ref={trackRef}
          className="flex gap-4 w-max"
          style={{ animation: `slider-scroll ${DURATION}s linear infinite` }}
        >
          {strip.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`group/tile relative flex-shrink-0 w-64 ${tileHeight} overflow-hidden`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/tile:scale-105 group-hover/tile:brightness-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent group-hover/tile:from-navy/55 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-white drop-shadow">
                  {item.label}
                </span>
                <span
                  className="block h-px bg-white/50 w-5 transition-all duration-500 group-hover/tile:w-10"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
