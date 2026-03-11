import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createZoneSchema = z.object({
  name: z.string().min(1).max(120),
  centerLon: z.number().min(-180).max(180),
  centerLat: z.number().min(-90).max(90),
  radiusMeters: z.number().int().positive()
});

type Props = {
  params: Promise<{ campaignId: string }>;
};

export async function GET(_: NextRequest, { params }: Props) {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const { campaignId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reward_zones")
    .select("id, campaign_id, name, center_lon, center_lat, radius_meters, is_active, updated_at")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest, { params }: Props) {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const { campaignId } = await params;
  const parsed = createZoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const payload = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reward_zones")
    .insert({
      campaign_id: campaignId,
      name: payload.name,
      center_lon: payload.centerLon,
      center_lat: payload.centerLat,
      radius_meters: payload.radiusMeters
    })
    .select("id, campaign_id, name, center_lon, center_lat, radius_meters, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const { campaignId } = await params;
  const parsed = createZoneSchema.extend({ zoneId: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const payload = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reward_zones")
    .update({
      name: payload.name,
      center_lon: payload.centerLon,
      center_lat: payload.centerLat,
      radius_meters: payload.radiusMeters
    })
    .eq("campaign_id", campaignId)
    .eq("id", payload.zoneId)
    .select("id, campaign_id, name, center_lon, center_lat, radius_meters, is_active, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}
