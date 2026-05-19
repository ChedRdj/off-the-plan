import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

async function handleJson(req: Request) {
  const body = await req.json().catch(() => ({}));
  const source = typeof body.source === "string" ? body.source : "contact";

  const contact_name = (body.contact_name ?? body.name ?? "")?.toString().trim();
  const email = (body.email ?? "")?.toString().trim();
  const phone = (body.phone ?? body.mobile ?? null)?.toString().trim() || null;
  const company = (body.company ?? null)?.toString().trim() || null;
  const development_name = (body.development_name ?? null)?.toString().trim() || null;
  const suburb = (body.suburb ?? null)?.toString().trim() || null;
  const state = (body.state ?? null)?.toString().trim() || null;
  const subject = (body.subject ?? null)?.toString().trim() || null;
  const message = (body.message ?? body.notes ?? null)?.toString().trim() || null;
  const expected_completion = (body.expected_completion ?? null)?.toString().trim() || null;
  const residence_count = body.residence_count != null && body.residence_count !== ""
    ? Number(body.residence_count)
    : null;

  if (!contact_name || !isEmail(email)) {
    return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("developer_leads").insert({
    source,
    contact_name,
    email,
    company,
    phone,
    development_name,
    suburb,
    state,
    residence_count,
    expected_completion,
    subject,
    message,
    notes: message,
  });
  if (error) {
    console.error("Lead insert error:", error);
    return NextResponse.json({ error: "Could not save your message. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

async function handleFormData(req: Request) {
  const formData = await req.formData();

  const data = {
    source: (formData.get("source") as string) || "list-a-listing",
    contact_name: (formData.get("contact_name") as string)?.trim()
      || `${(formData.get("first_name") as string) ?? ""} ${(formData.get("last_name") as string) ?? ""}`.trim(),
    email: (formData.get("email") as string)?.trim(),
    company: (formData.get("company") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    development_name: (formData.get("development_name") as string)?.trim() || null,
    suburb: (formData.get("suburb") as string)?.trim() || null,
    state: (formData.get("state") as string) || null,
    residence_count: formData.get("residence_count") ? Number(formData.get("residence_count")) : null,
    expected_completion: (formData.get("expected_completion") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    message: (formData.get("message") as string)?.trim() || null,
    subject: (formData.get("subject") as string)?.trim() || null,
  };

  if (!data.contact_name || !data.email) {
    return NextResponse.redirect(new URL("/list-a-listing?error=1", req.url));
  }

  const { error } = await supabaseAdmin.from("developer_leads").insert(data);
  if (error) {
    console.error("Developer lead insert error:", error);
    return NextResponse.redirect(new URL("/list-a-listing?error=1", req.url));
  }

  return NextResponse.redirect(new URL("/list-a-listing?submitted=1", req.url), { status: 303 });
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return await handleJson(req);
    }
    return await handleFormData(req);
  } catch (err) {
    console.error("Leads route error:", err);
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/list-a-listing?error=1", req.url));
  }
}
