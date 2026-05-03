import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { development_id, name, email, mobile, photo_url, sort_order } = await req.json();
    if (!development_id) {
      return NextResponse.json({ error: "Missing development_id" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("listing_agents")
      .insert({ development_id, name: name || null, email: email || null, mobile: mobile || null, photo_url: photo_url || null, sort_order: sort_order ?? 0 })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("listing_agents")
      .update({
        name: fields.name || null,
        email: fields.email || null,
        mobile: fields.mobile || null,
        photo_url: fields.photo_url || null,
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin.from("listing_agents").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
