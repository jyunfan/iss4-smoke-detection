import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createCampaignSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  hourlyRewardAmount: z.number().nonnegative(),
  budgetLimit: z.number().nonnegative(),
  status: z.enum(["draft", "active", "paused", "ended"]).default("draft")
});

export async function GET() {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .select("id, name, status, hourly_reward_amount, budget_limit, spent_budget, created_at")
    .eq("sponsor_user_id", auth.ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["sponsor"]);
  if (auth.error) return auth.error;

  const parsed = createCampaignSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const payload = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .insert({
      sponsor_user_id: auth.ctx.userId,
      name: payload.name,
      description: payload.description ?? null,
      hourly_reward_amount: payload.hourlyRewardAmount,
      budget_limit: payload.budgetLimit,
      status: payload.status
    })
    .select("id, name, status, hourly_reward_amount, budget_limit, spent_budget, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
