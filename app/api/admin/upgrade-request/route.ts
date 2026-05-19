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

  // Get development name for reference
  const { data: dev } = await supabaseAdmin
    .from("developments")
    .select("name")
    .eq("id", projectId)
    .single();

  // Log the request — you can wire this to email/Stripe later
  console.log("Upgrade request:", {
    project: dev?.name,
    upgradeType,
    startDate,
    endDate,
  });

  return NextResponse.json({ ok: true });
}
