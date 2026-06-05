"use client";

import { useState } from "react";

/**
 * Reuses the impersonation endpoint built for the All Agencies page
 * (POST /api/admin/users/impersonate) — generates a one-time magic
 * link and opens the member's portal in a new tab so admin can see
 * exactly what they see.
 *
 * Disabled when the profile has no email on file (e.g. legacy rows
 * inserted without auth.users linkage).
 */
export function MemberRowActions({ email }: { email: string | null }) {
  const [busy, setBusy] = useState(false);

  async function handleSignInAs() {
    if (!email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        alert(json.error ?? "Could not generate sign-in link.");
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignInAs}
      disabled={!email || busy}
      title={email ? "Open this member's portal in a new tab" : "No email on file"}
      className="font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {busy ? "…" : "Sign In As"}
    </button>
  );
}
