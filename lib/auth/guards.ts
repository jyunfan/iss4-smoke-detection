import { NextResponse } from "next/server";
import { isAppRole, type AppRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthContext = {
  userId: string;
  role: AppRole;
  displayName: string | null;
};

export async function requireAuth(allowedRoles?: AppRole[]) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse,
      ctx: null
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("app_users")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !isAppRole(profile.role)) {
    return {
      error: NextResponse.json({ error: "Missing app profile" }, { status: 403 }) as NextResponse,
      ctx: null
    };
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) as NextResponse,
      ctx: null
    };
  }

  return {
    error: null,
    ctx: {
      userId: profile.id,
      role: profile.role,
      displayName: profile.display_name
    } satisfies AuthContext
  };
}
