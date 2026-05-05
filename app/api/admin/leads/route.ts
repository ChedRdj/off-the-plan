import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 10;

  let query = supabaseAdmin
    .from("developer_leads")
    .select(
      "contact_name, company, phone, development_name, email, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filter === "30") {
    query = query.gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  } else if (filter === "60") {
    query = query.gte("created_at", new Date(Date.now() - 60 * 864e5).toISOString());
  }

  const { data, count, error } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, pageSize });
}
