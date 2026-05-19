import { NextResponse } from "next/server";
import { supabaseAdmin } from "./admin";
import { createClient } from "./server";

type GuardSuccess = {
  user: { id: string; email?: string | null };
  isAdmin: boolean;
  isMember: boolean;
  interestType: string | null;
};

type GuardResult = { error: NextResponse } | GuardSuccess;

type ProfileFailure = { kind: "error"; errResp: NextResponse };
type ProfileSuccess = {
  kind: "ok";
  user: { id: string; email?: string | null };
  isAdmin: boolean;
  isMember: boolean;
  interestType: string | null;
};

async function loadProfile(): Promise<ProfileFailure | ProfileSuccess> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "error", errResp: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, interest_type")
    .eq("id", user.id)
    .single();
  const isAdmin = !!profile?.is_admin;
  const interestType = (profile?.interest_type as string | null | undefined) ?? null;
  const isMember = !!interestType && ["Developer", "Agent"].includes(interestType);
  return { kind: "ok", user, isAdmin, isMember, interestType };
}

/** Require a logged-in admin (profiles.is_admin = true). */
export async function requireAdmin(): Promise<GuardResult> {
  const result = await loadProfile();
  if (result.kind === "error") return { error: result.errResp };
  if (!result.isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    user: { id: result.user.id, email: result.user.email },
    isAdmin: true,
    isMember: result.isMember,
    interestType: result.interestType,
  };
}

/** Require admin OR a member with interest_type Developer/Agent. */
export async function requireMemberOrAdmin(): Promise<GuardResult> {
  const result = await loadProfile();
  if (result.kind === "error") return { error: result.errResp };
  if (!result.isAdmin && !result.isMember) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    user: { id: result.user.id, email: result.user.email },
    isAdmin: result.isAdmin,
    isMember: result.isMember,
    interestType: result.interestType,
  };
}
