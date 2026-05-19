import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <section className="bg-navy py-16">
        <div className="container-padded">
          <h1 className="font-display font-light text-ink-light text-section-xl">
            Terms and Conditions
          </h1>
        </div>
      </section>

      <div className="container-padded py-14 max-w-3xl">
        <p className="font-mono text-label-sm uppercase tracking-widest text-ink-dark/40 mb-6">
          Last updated: 19 May 2026
        </p>

        <div className="prose font-sans text-body-md text-ink-dark/80 leading-relaxed flex flex-col gap-6">
          <p className="text-orange italic">
            Placeholder content. The site owner&apos;s legal team should replace this page with the
            finalised Terms and Conditions before public launch.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">1. About this site</h2>
          <p>
            Off The Plan (&quot;we&quot;, &quot;our&quot;) operates this website as a platform for
            listing and discovering off-the-plan property developments in Australia.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">2. Use of the site</h2>
          <p>
            By accessing or using this site you agree to these Terms. You agree to use the site only
            for lawful purposes and in a way that does not infringe the rights of, or restrict the
            use of the site by, any third party.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">3. Listings</h2>
          <p>
            Property information is provided by developers, agents and other third parties. We do
            not warrant the accuracy or completeness of any listing and you should make your own
            enquiries before relying on any information shown.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">4. Accounts</h2>
          <p>
            If you create an account you are responsible for maintaining the confidentiality of your
            credentials and for all activity that occurs under your account.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">5. Privacy</h2>
          <p>
            Our handling of personal information is described in our{" "}
            <a href="/privacy" className="text-orange hover:underline">Privacy Policy</a>.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">6. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of the site after a change
            takes effect constitutes acceptance of the updated Terms.
          </p>

          <h2 className="font-display font-light text-navy text-section-md">7. Contact</h2>
          <p>
            Questions about these Terms can be sent to{" "}
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
