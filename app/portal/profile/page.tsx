import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ProfileForm } from "@/app/account/profile-form";

export default async function PortalProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, interest_type")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Profile</h1>
        <p className="font-sans text-sm text-ink/50 mt-1">Update your name and profile type.</p>
      </div>
      <div className="bg-white p-6 max-w-lg">
        <ProfileForm
          fullName={(profile?.full_name as string) ?? ""}
          email={user.email ?? ""}
          interestType={(profile?.interest_type as string) ?? null}
        />
      </div>
    </div>
  );
}
