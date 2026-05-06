import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function PortalListings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabaseAdmin
    .from("developments")
    .select("id, name, suburb, state, type, price_display, is_published, is_featured, view_count, phone_click_count, hero_image_url")
    .eq("owner_user_id", user.id)
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">My Listings</h1>
        <p className="font-sans text-sm text-ink/50 mt-1">All developments assigned to your account.</p>
      </div>

      <div className="bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Thumbnail</th>
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Project</th>
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Type</th>
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Price</th>
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Status</th>
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50">Views</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center font-sans text-sm text-ink/40">
                  No listings assigned yet. Contact the platform admin to get started.
                </td>
              </tr>
            ) : (
              (listings ?? []).map((l) => (
                <tr key={l.id as string} className="border-b border-line last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-3">
                    {l.hero_image_url ? (
                      <img
                        src={l.hero_image_url as string}
                        alt={l.name as string}
                        className="w-14 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-14 h-10 bg-line" />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-sans text-sm text-ink font-medium">{l.name as string}</p>
                    <p className="font-sans text-xs text-ink/40">{l.suburb as string}, {l.state as string}</p>
                  </td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{(l.type as string) ?? "—"}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{(l.price_display as string) ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border w-fit ${
                        l.is_published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-ink/5 text-ink/40 border-line"
                      }`}>
                        {l.is_published ? "Active" : "Inactive"}
                      </span>
                      {l.is_featured && (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border w-fit bg-orange/10 text-orange border-orange/20">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{(l.view_count as number) ?? 0}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/listings/${l.id}`}
                      className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
