import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  const providedSecret = request.headers.get("x-job-secret");
  const expectedSecret = process.env.PAYOUT_JOB_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized job request" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: campaigns, error: campaignError } = await supabase
    .from("sponsor_campaigns")
    .select("id, name, status, hourly_reward_amount, budget_limit, spent_budget")
    .eq("status", "active");

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 400 });
  }

  // TODO:
  // 1. query active zones + enrolled devices
  // 2. evaluate online + zone radius eligibility
  // 3. insert eligibility_checks
  // 4. insert reward_payouts
  // 5. insert campaign_budget_ledger
  // 6. update sponsor_campaigns.spent_budget
  return NextResponse.json({
    dryRun: true,
    activeCampaignCount: campaigns?.length ?? 0,
    message: "Hourly payout worker skeleton is ready."
  });
}
