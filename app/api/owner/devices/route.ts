import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SENSOR_PROVIDERS } from "@/lib/sensors/providers";

const createDeviceSchema = z.object({
  externalDeviceId: z.string().min(1),
  provider: z.enum(SENSOR_PROVIDERS).default("purpleair"),
  nickname: z.string().max(120).optional()
});

export async function GET() {
  const auth = await requireAuth(["sensor_owner"]);
  if (auth.error) return auth.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sensor_devices")
    .select("id, external_device_id, provider, nickname, status, last_seen_at, created_at")
    .eq("owner_user_id", auth.ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["sensor_owner"]);
  if (auth.error) return auth.error;

  const parsed = createDeviceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const payload = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("sensor_devices")
    .insert({
      owner_user_id: auth.ctx.userId,
      external_device_id: payload.externalDeviceId,
      provider: payload.provider,
      nickname: payload.nickname ?? null
    })
    .select("id, external_device_id, provider, nickname, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
