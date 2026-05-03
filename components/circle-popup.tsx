"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "otp_popup_dismissed";
const POPUP_DELAY_MS = 12000; // 12 seconds

const interestOptions = [
  "New Apartments",
  "Townhouses",
  "Land and Estates",
  "Commercial",
  "House & Land",
  "New Home Design",
];

const notifyOptions = ["Property Alerts", "Both", "News"];

export function CirclePopup() {
  const [visible, setVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [notifyPref, setNotifyPref] = useState("Both");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    // Don't show if already dismissed within the last 30 days
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedAt < thirtyDays) return;
      }
    } catch {
      // localStorage not available (SSR guard)
      return;
    }

    const timer = setTimeout(() => setVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {}
    setVisible(false);
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email) return;
    setStatus("loading");

    const interestType = selectedInterests.length > 0
      ? selectedInterests.join(", ")
      : notifyPref;

    try {
      const res = await fetch("/api/circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          interest_type: interestType,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => dismiss(), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sign up for property alerts">
      {/* Overlay */}
      <div className="absolute inset-0 bg-navy/60" onClick={dismiss} aria-hidden="true" />

      {/* Panel */}
      <div className="relative z-10 bg-orange w-full max-w-2xl p-8 md:p-10 shadow-2xl">
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="text-center py-8">
            <p className="font-display font-light text-white text-3xl mb-3">You're in!</p>
            <p className="font-sans text-white/80">We'll send you the best matches the moment they list.</p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-light text-white text-2xl md:text-3xl uppercase tracking-wide mb-2">
              Sign up today for the latest news and developments
            </h2>
            <p className="font-sans text-white/80 text-sm mb-7">
              Tell us what you're looking for and we'll send you the best matches the moment they list.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: name + email */}
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Name*"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-white/10 border border-white/30 text-white placeholder-white/50 font-sans text-sm px-4 py-3 focus:outline-none focus:border-white"
                  />
                  <input
                    type="email"
                    placeholder="Email*"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border border-white/30 text-white placeholder-white/50 font-sans text-sm px-4 py-3 focus:outline-none focus:border-white"
                  />

                  {/* Notification preference */}
                  <div>
                    <p className="font-mono text-label-sm uppercase tracking-widest text-white/70 mb-2">
                      I would like to be notified about
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {notifyOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setNotifyPref(opt)}
                          className={`font-sans text-sm py-2 px-3 border transition-colors ${
                            notifyPref === opt
                              ? "bg-navy border-navy text-white"
                              : "bg-transparent border-white/40 text-white/80 hover:border-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: interests + CTA */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="font-mono text-label-sm uppercase tracking-widest text-white/70 mb-2">
                      I'm looking for
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {interestOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleInterest(opt)}
                          className={`font-sans text-sm py-2 px-3 border transition-colors text-left ${
                            selectedInterests.includes(opt)
                              ? "bg-navy border-navy text-white"
                              : "bg-transparent border-white/40 text-white/80 hover:border-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-navy text-white font-mono text-label-lg uppercase tracking-widest py-4 hover:bg-navy/80 transition-colors disabled:opacity-50 mt-auto"
                  >
                    {status === "loading" ? "Signing up…" : "Sign me up"}
                  </button>

                  {status === "error" && (
                    <p className="font-sans text-xs text-white/80">Something went wrong. Please try again.</p>
                  )}

                  <p className="font-sans text-xs text-white/60">You can unsubscribe anytime.</p>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
