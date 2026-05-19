import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded">
          <h1 className="font-display font-light text-ink-light text-section-xl">Privacy Policy</h1>
        </div>
      </section>

      <div className="container-padded py-14 max-w-3xl">
        <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-6">
          Last updated: 19 May 2026
        </p>

        <div className="prose font-sans text-body-md text-ink-dark/80 leading-relaxed flex flex-col gap-6">
          <p className="text-orange italic">
            Placeholder content. The site owner&apos;s legal team should replace this page with the
            finalised Privacy Policy before public launch. The points below describe what the
            platform actually collects today so the policy can be drafted accurately.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">1. Information we collect</h2>
          <p>
            We collect information you provide directly &mdash; including your name, email address,
            phone number, postcode, and any messages you submit through our forms (enquiries,
            contact, list-a-listing, and the Inner Circle signup). For account holders we also
            store profile details, role (Buyer, Agent, Developer, etc.) and uploaded images.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">2. Automatically collected information</h2>
          <p>
            When you view a listing we record aggregate usage events (views, shares, phone clicks)
            tied to the listing, not to you personally.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">3. How we use information</h2>
          <p>
            We use submitted information to respond to your enquiry, manage your account, send
            transactional emails, and share enquiry details with the relevant developer or agent
            for the listing you contacted.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">4. Sharing</h2>
          <p>
            We do not sell your personal information. Enquiry details are shared with the listing
            owner (developer or agent) so they can follow up. We use third-party providers
            (Supabase for data storage, Vercel for hosting) which process data on our behalf.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">5. Your choices</h2>
          <p>
            You can request access to, correction of, or deletion of your personal information by
            emailing us at the address below.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">6. Security</h2>
          <p>
            We use reasonable measures to protect your information. No method of transmission or
            storage is completely secure; please do not share sensitive personal data through this
            site unless asked to.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">7. Contact</h2>
          <p>
            Privacy questions can be sent to{" "}
            <a href="mailto:info@offtheplan.com.au" className="text-orange hover:underline">
              info@offtheplan.com.au
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
