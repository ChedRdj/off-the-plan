import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import LeadsTable from "./leads-table";

export default async function PortalLeads() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabaseAdmin
    .from("developments")
    .select("id, name")
    .eq("owner_user_id", user.id);

  const devIds = (listings ?? []).map((l) => l.id as string);

  const { data: enquiries } = devIds.length > 0
    ? await supabaseAdmin
        .from("enquiries")
        .select("id, full_name, email, mobile, buyer_type, notes, created_at, development_id")
        .in("development_id", devIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const devMap = Object.fromEntries((listings ?? []).map((l) => [l.id as string, l.name as string]));

  const leads = (enquiries ?? []).map((e) => ({
    id: e.id as string,
    full_name: e.full_name as string | null,
    email: e.email as string | null,
    mobile: e.mobile as string | null,
    buyer_type: e.buyer_type as string | null,
    notes: e.notes as string | null,
    created_at: e.created_at as string | null,
    development_name: devMap[e.development_id as string] ?? "Unknown",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Leads</h1>
        <p className="font-sans text-sm text-ink/50 mt-1">Enquiries submitted on your listings.</p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
