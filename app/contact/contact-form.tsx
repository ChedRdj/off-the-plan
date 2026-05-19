"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "contact",
          name: fd.get("name"),
          email: fd.get("email"),
          subject: fd.get("subject") || null,
          message: fd.get("message"),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not send your message.");
      }
      setSent(true);
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="font-sans text-body-md text-orange">
          Thanks! We&apos;ve received your message and will be in touch shortly.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 hover:text-orange transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="font-sans text-body-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="section-label block mb-1.5">Name</label>
        <input
          type="text"
          name="name"
          required
          className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
        />
      </div>
      <div>
        <label className="section-label block mb-1.5">Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
        />
      </div>
      <div>
        <label className="section-label block mb-1.5">Subject</label>
        <input
          type="text"
          name="subject"
          className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
        />
      </div>
      <div>
        <label className="section-label block mb-1.5">Message</label>
        <textarea
          name="message"
          rows={5}
          required
          className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60 resize-none"
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary self-start disabled:opacity-50">
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
