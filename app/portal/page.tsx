import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Phone, Share2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function PortalDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabaseAdmin
    .from("developments")
    .select("id, name, price_display, is_published, view_count, phone_click_count, share_count")
    .eq("owner_user_id", user.id)
    .order("name");

  const devIds = (listings ?? []).map((l) => l.id as string);

  const { count: enquiryCount } = devIds.length > 0
    ? await supabaseAdmin
        .from("enquiries")
        .select("*", { count: "exact", head: true })
        .in("development_id", devIds)
    : { count: 0 };

  const totalViews = (listings ?? []).reduce((s, d) => s + ((d.view_count as number) ?? 0), 0);
  const totalPhoneClicks = (listings ?? []).reduce((s, d) => s + ((d.phone_click_count as number) ?? 0), 0);
  const totalShares = (listings ?? []).reduce((s, d) => s + ((d.share_count as number) ?? 0), 0);

  const rawName = (profile?.full_name as string | null)?.split(" ")[0]
    ?? user.email?.split("@")[0]
    ?? "there";
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const emoji = hour < 12 ? "☀️" : hour < 18 ? "🌤️" : "🌙";

  const stats = [
    { label: "Total Views",     value: totalViews,        icon: Eye },
    { label: "Total Enquiries", value: enquiryCount ?? 0, icon: MessageSquare },
    { label: "Phone Clicks",    value: totalPhoneClicks,  icon: Phone },
    { label: "Total Shares",    value: totalShares,       icon: Share2 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-sm p-6 text-white" style={{ background: "#1a2340" }}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">
          {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="font-serif text-2xl">{emoji} {timeLabel}, {firstName}!</h1>
        <p className="font-sans text-sm text-white/50 mt-1">Here's how your listings are performing.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{label}</p>
              <p className="font-serif text-3xl text-orange mt-1">{value}</p>
            </div>
            <Icon size={32} className="text-ink/10" />
          </div>
        ))}
      </div>

      {/* Listings summary */}
      <div className="bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold">My Listings</h2>
          <Link href="/portal/listings" className="font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink transition-colors">
            View all →
          </Link>
        </div>
        {(listings ?? []).length === 0 ? (
          <p className="px-5 py-10 font-sans text-sm text-ink/40 text-center">
            No listings assigned yet. Contact the platform admin to get started.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Project</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Price</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Status</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Views</th>
              </tr>
            </thead>
            <tbody>
              {(listings ?? []).slice(0, 5).map((l) => (
                <tr key={l.id as string} className="border-b border-line last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-3 font-sans text-sm text-ink">{l.name as string}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{(l.price_display as string) ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                      l.is_published
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-ink/5 text-ink/40 border-line"
                    }`}>
                      {l.is_published ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{(l.view_count as number) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
