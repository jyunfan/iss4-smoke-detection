import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const enrollSchema = z.object({
  zoneId: z.string().uuid(),
  deviceId: z.string().uuid()
});

export async function GET() {
  const auth = await requireAuth(["sensor_owner"]);
  if (auth.error) return auth.error;

  const supabase = await createServerSupabaseClient();
  const serviceSupabase = createServiceRoleSupabaseClient();

  const { data: enrollments, error } = await supabase
    .from("zone_enrollments")
    .select("id, zone_id, device_id, status, joined_at, left_at")
    .order("joined_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: devices, error: devicesError } = await supabase
    .from("sensor_devices")
    .select("id, nickname, external_device_id, status")
    .eq("owner_user_id", auth.ctx.userId)
    .order("created_at", { ascending: false });

  if (devicesError) {
    return NextResponse.json({ error: devicesError.message }, { status: 400 });
  }

  const { data: availableZones, error: zonesError } = await serviceSupabase
    .from("reward_zones")
    .select("id, campaign_id, name, center_lon, center_lat, radius_meters, sponsor_campaigns(name, status)")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (zonesError) {
    return NextResponse.json({ error: zonesError.message }, { status: 400 });
  }

  const normalizedZones = (availableZones ?? [])
    .filter((item) => {
      const campaign = Array.isArray(item.sponsor_campaigns) ? item.sponsor_campaigns[0] : item.sponsor_campaigns;
      return campaign?.status === "active";
    })
    .map((item) => {
      const campaign = Array.isArray(item.sponsor_campaigns) ? item.sponsor_campaigns[0] : item.sponsor_campaigns;
      return {
        id: item.id,
        campaign_id: item.campaign_id,
        campaign_name: campaign?.name ?? "Campaign",
        name: item.name,
        center_lon: item.center_lon,
        center_lat: item.center_lat,
        radius_meters: item.radius_meters
      };
    });

  return NextResponse.json({
    devices: devices ?? [],
    availableZones: normalizedZones,
    enrollments: enrollments ?? []
  });
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
