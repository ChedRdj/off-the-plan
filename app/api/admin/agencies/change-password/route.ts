import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { id, password } = await req.json();
    if (!id || !password) {
      return NextResponse.json({ error: "Missing id or password" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Look up the agency email to find their auth account
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("email")
      .eq("id", id)
      .single();

    if (!agency?.email) {
      return NextResponse.json({ error: "Agency has no email on record." }, { status: 404 });
    }

    // Find the auth user by email — paginate so we don't silently miss past page 1.
    const target = agency.email.toLowerCase();
    let authUser: { id: string } | null = null;
    for (let page = 1; page <= 50; page++) {
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
      const found = data.users.find((u) => u.email?.toLowerCase() === target);
      if (found) { authUser = found; break; }
      if (data.users.length < 200) break;
    }
    if (!authUser) {
      return NextResponse.json({ error: "No portal account found for this agency's email." }, { status: 404 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
