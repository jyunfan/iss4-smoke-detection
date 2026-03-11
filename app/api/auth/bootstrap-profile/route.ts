import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAppRole, type AppRole } from "@/lib/auth/roles";

const bootstrapSchema = z.object({
  role: z.enum(["sensor_owner", "sponsor"]).default("sensor_owner"),
  displayName: z.string().min(1).max(120).optional()
});

function pickRedirect(role: AppRole) {
  if (role === "sponsor") return "/sponsor/dashboard";
  if (role === "sensor_owner") return "/owner/dashboard";
  return "/";
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payloadResult = bootstrapSchema.safeParse(await request.json().catch(() => ({})));
  if (!payloadResult.success) {
    return NextResponse.json({ error: payloadResult.error.flatten() }, { status: 422 });
  }

  const payload = payloadResult.data;
  const { data: existingProfile } = await supabase
    .from("app_users")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  if (existingProfile && isAppRole(existingProfile.role)) {
    return NextResponse.json({
      profile: existingProfile,
      redirectTo: pickRedirect(existingProfile.role)
    });
  }

  const displayNameFromAuth =
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
    (typeof user.email === "string" ? user.email.split("@")[0] : null);

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      id: user.id,
      role: payload.role,
      display_name: payload.displayName ?? displayNameFromAuth,
      is_anonymous: false
    })
    .select("id, role, display_name")
    .single();

  if (error || !data || !isAppRole(data.role)) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to initialize app profile" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    profile: data,
    redirectTo: pickRedirect(data.role)
  });
}
