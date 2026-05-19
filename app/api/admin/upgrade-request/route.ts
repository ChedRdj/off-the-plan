import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";

export async function POST(req: NextRequest) {
  const auth = await requireMemberOrAdmin();
  if ("error" in auth) return auth.error;

  const { projectId, upgradeType, startDate, endDate } = await req.json();

  if (!projectId || !upgradeType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Members can only request upgrades on their own listings.
  if (!auth.isAdmin) {
    const { data: dev } = await supabaseAdmin
      .from("developments")
      .select("owner_user_id")
      .eq("id", projectId)
      .single();
    if (!dev || dev.owner_user_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from("upgrade_requests").insert({
    user_id: auth.user.id,
    development_id: projectId,
    upgrade_type: upgradeType,
    start_date: startDate || null,
    end_date: endDate || null,
  });

  if (error) {
    console.error("Upgrade request insert error:", error);
    return NextResponse.json({ error: "Could not record your request." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
