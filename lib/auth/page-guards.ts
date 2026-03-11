import { redirect } from "next/navigation";
import { isAppRole, type AppRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageAuthContext = {
  userId: string;
  role: AppRole;
  displayName: string | null;
};

export async function requirePageRole(allowedRoles: AppRole[]): Promise<PageAuthContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || !isAppRole(profile.role)) {
    redirect("/login?reason=bootstrap");
  }

  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === "sponsor") {
      redirect("/sponsor/dashboard");
    }
    if (profile.role === "sensor_owner") {
      redirect("/owner/dashboard");
    }
    redirect("/");
  }

  return {
    userId: profile.id,
    role: profile.role,
    displayName: profile.display_name
  };
}
