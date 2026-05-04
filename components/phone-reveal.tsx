"use client";

import { useState } from "react";

interface PhoneRevealProps {
  phone: string;
}

/**
 * Shows a masked phone number with a "show" button.
 * Reveals the full number on click.
 * e.g. "1800 606 ***" → "1800 606 808"
 */
export function PhoneReveal({ phone }: PhoneRevealProps) {
  const [revealed, setRevealed] = useState(false);

  // Mask the last 3 digits of the raw number
  const masked = phone.replace(/\d{3}$/, "***");

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={revealed ? `tel:${phone.replace(/\s/g, "")}` : undefined}
        className="font-sans text-[13px] text-orange hover:text-orange/70 transition-colors"
        onClick={revealed ? undefined : (e) => e.preventDefault()}
      >
        {revealed ? phone : masked}
      </a>
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="font-mono text-[9px] uppercase tracking-widest text-ink/40 border border-ink/20 px-1.5 py-0.5 hover:border-orange hover:text-orange transition-colors leading-none"
        >
          show
        </button>
      )}
    </span>
  );
}
