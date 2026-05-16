import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AgencyProfilePage({ params }: { params: { id: string } }) {
  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!agency) notFound();

  const socials = [
    { label: "Facebook", url: agency.facebook_url },
    { label: "Instagram", url: agency.instagram_url },
    { label: "LinkedIn", url: agency.linkedin_url },
    { label: "Pinterest", url: agency.pinterest_url },
    { label: "YouTube", url: agency.youtube_url },
    { label: "Twitter / X", url: agency.twitter_url },
    { label: "Website", url: agency.website_url },
  ].filter((s) => s.url);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/agencies"
          className="font-sans text-sm text-ink/40 hover:text-ink transition-colors"
        >
          ← All Agencies
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-line p-5 mb-4 flex items-center gap-4">
        {agency.profile_pic ? (
          <Image
            src={agency.profile_pic}
            alt={agency.name ?? ""}
            width={64}
            height={64}
            className="rounded-full object-cover w-16 h-16"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-cream-alt flex items-center justify-center text-2xl font-display text-navy">
            {(agency.name ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-display font-semibold text-navy text-lg leading-tight">{agency.name ?? "—"}</p>
          {agency.email && <p className="font-sans text-sm text-ink/60">{agency.email}</p>}
          <div className="flex gap-2 mt-1">
            <span className={`inline-block px-2 py-0.5 text-xs font-sans font-semibold rounded ${
              agency.email_verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}>
              {agency.email_verified ? "Email Verified" : "Not Verified"}
            </span>
            <span className={`inline-block px-2 py-0.5 text-xs font-sans font-semibold rounded ${
              agency.portal_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {agency.portal_status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white border border-line p-5 mb-4">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink/40 mb-4">Company Details</h2>
        <div className="space-y-3">
          <Field label="Business Name" value={agency.org_name} />
          {agency.about && (
            <div>
              <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">About</p>
              <p className="font-sans text-sm text-ink leading-relaxed">{agency.about}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email Address" value={agency.org_email} />
            <Field label="Phone" value={agency.org_phone ?? agency.mobile} />
          </div>
        </div>
      </div>

      {/* Logos */}
      {(agency.org_logo_url || agency.dev_logo_url) && (
        <div className="bg-white border border-line p-5 mb-4">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink/40 mb-4">Logos</h2>
          <div className="grid grid-cols-2 gap-4">
            {agency.org_logo_url && (
              <div className="text-center">
                <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-2">Company Logo</p>
                <Image
                  src={agency.org_logo_url}
                  alt="Company logo"
                  width={160}
                  height={80}
                  className="mx-auto object-contain max-h-20"
                />
              </div>
            )}
            {agency.dev_logo_url && (
              <div className="text-center">
                <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-2">Developer Logo</p>
                <Image
                  src={agency.dev_logo_url}
                  alt="Developer logo"
                  width={160}
                  height={80}
                  className="mx-auto object-contain max-h-20"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Reach */}
      {socials.length > 0 && (
        <div className="bg-white border border-line p-5 mb-4">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink/40 mb-4">Social Reach</h2>
          <div className="space-y-2">
            {socials.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="font-sans text-xs text-ink/40 w-24 shrink-0">{s.label}</span>
                <a
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-blue-600 hover:underline truncate"
                >
                  {s.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white border border-line p-5">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink/40 mb-4">Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Active Listings" value={String(agency.total_active_listings)} />
          <StatCard label="Type" value={agency.is_developer ? "Developer" : "Agency"} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-sans text-sm text-ink">{value || "—"}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream-alt p-3">
      <p className="font-sans text-xs text-ink/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-display font-semibold text-navy text-lg">{value}</p>
    </div>
  );
}
