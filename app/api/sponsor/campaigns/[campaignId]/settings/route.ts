import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSettingsSchema = z.object({
  hourlyRewardAmount: z.number().nonnegative(),
  budgetLimit: z.number().nonnegative(),
  status: z.enum(["draft", "active", "paused", "ended"]).optional()
});

type Props = {
  params: Promise<{ campaignId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const parsed = updateSettingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { campaignId } = await params;
  const payload = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .update({
      hourly_reward_amount: payload.hourlyRewardAmount,
      budget_limit: payload.budgetLimit,
      ...(payload.status ? { status: payload.status } : {})
    })
    .eq("id", campaignId)
    .select("id, name, status, hourly_reward_amount, budget_limit, spent_budget, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}
