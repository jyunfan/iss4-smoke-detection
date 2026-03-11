import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ campaignId: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const search = request.nextUrl.searchParams;
  const limit = Math.min(Number(search.get("limit") ?? 100), 500);
  const { campaignId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reward_payouts")
    .select("id, campaign_id, zone_id, device_id, payout_hour, amount, status, created_at")
    .eq("campaign_id", campaignId)
    .order("payout_hour", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const totalAmount = (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return NextResponse.json({
    items: data,
    summary: {
      totalRows: data?.length ?? 0,
      totalAmount
    }
  });
}
