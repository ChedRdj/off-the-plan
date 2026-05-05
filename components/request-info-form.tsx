"use client";

import { useState } from "react";

interface RequestInfoFormProps {
  developmentName: string;
  developmentId: string;
}

export function RequestInfoForm({ developmentName, developmentId }: RequestInfoFormProps) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-sans text-body-md text-orange text-center">
          Thanks! We've received your enquiry and will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="development_id" value={developmentId} />
      <input type="hidden" name="development_name" value={developmentName} />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="first_name"
          type="text"
          placeholder="First Name*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
        <input
          name="last_name"
          type="text"
          placeholder="Last Name*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email Address*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="postcode"
          type="text"
          placeholder="Postcode*"
          required
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40"
        />
        <select
          name="describe_yourself"
          className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink/50 outline-none focus:border-navy/50 bg-white cursor-pointer"
        >
          <option value="">Describe Yourself*</option>
          {["Buyer", "Investor", "First Home Buyer", "Downsizer", "Agent", "Developer", "Other"].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <textarea
        name="message"
        placeholder="Message*"
        rows={5}
        required
        className="border border-line px-3 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-navy/50 bg-white placeholder:text-ink/40 resize-none"
      />

      <div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-8 py-3 bg-navy text-white hover:bg-orange transition-colors"
        >
          Send
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8h12M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
