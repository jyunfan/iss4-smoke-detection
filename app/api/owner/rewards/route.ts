import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAuth(["sensor_owner"]);
  if (auth.error) return auth.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reward_payouts")
    .select("id, campaign_id, zone_id, device_id, payout_hour, amount, status, created_at")
    .order("payout_hour", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    items: data,
    ownerId: auth.ctx.userId
  });
}
