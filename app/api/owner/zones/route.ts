import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const enrollSchema = z.object({
  zoneId: z.string().uuid(),
  deviceId: z.string().uuid()
});

export async function GET() {
  const auth = await requireAuth(["sensor_owner"]);
  if (auth.error) return auth.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("zone_enrollments")
    .select("id, zone_id, device_id, status, joined_at, left_at")
    .order("joined_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data, ownerId: auth.ctx.userId });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["sensor_owner"]);
  if (auth.error) return auth.error;

  const parsed = enrollSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("zone_enrollments")
    .insert({
      zone_id: parsed.data.zoneId,
      device_id: parsed.data.deviceId
    })
    .select("id, zone_id, device_id, status, joined_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
