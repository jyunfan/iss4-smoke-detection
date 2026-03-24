import { NextRequest, NextResponse } from "next/server";
import type { Database, Json } from "@/lib/types/db";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

type CampaignRow = Database["public"]["Tables"]["sponsor_campaigns"]["Row"];
type EnrollmentRow = Database["public"]["Tables"]["zone_enrollments"]["Row"];
type EligibilityInsert = Database["public"]["Tables"]["eligibility_checks"]["Insert"];
type EligibilityRow = Database["public"]["Tables"]["eligibility_checks"]["Row"];
type LedgerInsert = Database["public"]["Tables"]["campaign_budget_ledger"]["Insert"];
type PayoutInsert = Database["public"]["Tables"]["reward_payouts"]["Insert"];

type ActiveEnrollmentRecord = {
  campaignId: string;
  zoneId: string;
  deviceId: string;
  joinedAt: string;
  leftAt: string | null;
  zoneName: string;
};

type EvaluatedEnrollment = {
  campaignId: string;
  zoneId: string;
  deviceId: string;
  isEligible: boolean;
  reasonCode: string;
  detail: Json;
};

function floorToHour(value: Date) {
  const normalized = new Date(value);
  normalized.setUTCMinutes(0, 0, 0);
  return normalized;
}

function getPayoutWindow(now: Date) {
  const currentHour = floorToHour(now);
  return {
    payoutHour: new Date(currentHour.getTime() - 60 * 60 * 1000),
    nextHour: currentHour
  };
}

function toIso(value: Date) {
  return value.toISOString();
}

function isEnrollmentActiveForHour(
  enrollment: Pick<EnrollmentRow, "joined_at" | "left_at" | "status">,
  payoutHour: Date,
  nextHour: Date
) {
  if (enrollment.status !== "active") return false;

  const joinedAt = new Date(enrollment.joined_at);
  const leftAt = enrollment.left_at ? new Date(enrollment.left_at) : null;

  return joinedAt < nextHour && (!leftAt || leftAt > payoutHour);
}

function evaluateEnrollment(
  enrollment: ActiveEnrollmentRecord,
  payoutHour: Date
): EvaluatedEnrollment {
  const detail: Record<string, Json> = {
    zoneName: enrollment.zoneName,
    payoutHour: toIso(payoutHour),
    joinedAt: enrollment.joinedAt
  };

  return {
    campaignId: enrollment.campaignId,
    zoneId: enrollment.zoneId,
    deviceId: enrollment.deviceId,
    isEligible: true,
    reasonCode: "eligible",
    detail
  };
}

export async function POST(request: NextRequest) {
  const providedSecret = request.headers.get("x-job-secret");
  const expectedSecret = process.env.PAYOUT_JOB_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized job request" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const now = new Date();
  const { payoutHour, nextHour } = getPayoutWindow(now);
  const payoutHourIso = toIso(payoutHour);
  const nextHourIso = toIso(nextHour);

  const { data: campaigns, error: campaignError } = await supabase
    .from("sponsor_campaigns")
    .select("id, name, status, hourly_reward_amount, budget_limit, reserved_budget, spent_budget, start_at, end_at")
    .eq("status", "active");

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 400 });
  }

  const activeCampaigns = ((campaigns ?? []) as CampaignRow[]).filter((campaign) => {
    const startsBeforeWindowEnd = !campaign.start_at || new Date(campaign.start_at) < nextHour;
    const endsAfterWindowStart = !campaign.end_at || new Date(campaign.end_at) > payoutHour;
    return startsBeforeWindowEnd && endsAfterWindowStart;
  });
  const campaignIds = activeCampaigns.map((campaign) => campaign.id);

  if (campaignIds.length === 0) {
    return NextResponse.json({
      payoutHour: payoutHourIso,
      activeCampaignCount: 0,
      processedCampaignCount: 0,
      eligibilityCheckCount: 0,
      payoutCount: 0,
      totalAmount: 0
    });
  }

  const { data: zoneRecords, error: zoneError } = await supabase
    .from("reward_zones")
    .select(
      "id, campaign_id, name, center_lon, center_lat, radius_meters, is_active, zone_enrollments(id, device_id, status, joined_at, left_at, sensor_devices(id, status, install_lon, install_lat, last_seen_at))"
    )
    .in("campaign_id", campaignIds)
    .eq("is_active", true);

  if (zoneError) {
    return NextResponse.json({ error: zoneError.message }, { status: 400 });
  }

  const activeEnrollments: ActiveEnrollmentRecord[] = [];
  for (const zoneRecord of zoneRecords ?? []) {
    const enrollments = Array.isArray(zoneRecord.zone_enrollments) ? zoneRecord.zone_enrollments : [];
    for (const enrollment of enrollments) {
      const device = Array.isArray(enrollment.sensor_devices)
        ? enrollment.sensor_devices[0]
        : enrollment.sensor_devices;

      if (!device) continue;
      if (!isEnrollmentActiveForHour(enrollment, payoutHour, nextHour)) continue;

      activeEnrollments.push({
        campaignId: zoneRecord.campaign_id,
        zoneId: zoneRecord.id,
        deviceId: enrollment.device_id,
        joinedAt: enrollment.joined_at,
        leftAt: enrollment.left_at,
        zoneName: zoneRecord.name
      });
    }
  }

  const evaluated = activeEnrollments
    .map((enrollment) => evaluateEnrollment(enrollment, payoutHour))
    .sort((left, right) => {
      if (left.campaignId !== right.campaignId) return left.campaignId.localeCompare(right.campaignId);
      if (left.zoneId !== right.zoneId) return left.zoneId.localeCompare(right.zoneId);
      return left.deviceId.localeCompare(right.deviceId);
    });

  const eligibilityPayload: EligibilityInsert[] = evaluated.map((item) => ({
    campaign_id: item.campaignId,
    zone_id: item.zoneId,
    device_id: item.deviceId,
    check_hour: payoutHourIso,
    is_eligible: item.isEligible,
    reason_code: item.reasonCode,
    detail: item.detail
  }));

  const eligibilityByKey = new Map<string, EligibilityRow>();
  if (eligibilityPayload.length > 0) {
    const { data: upsertedChecks, error: eligibilityError } = await supabase
      .from("eligibility_checks")
      .upsert(eligibilityPayload, {
        onConflict: "campaign_id,zone_id,device_id,check_hour"
      })
      .select("id, campaign_id, zone_id, device_id, check_hour, is_eligible, reason_code, detail, created_at");

    if (eligibilityError) {
      return NextResponse.json({ error: eligibilityError.message }, { status: 400 });
    }

    for (const check of (upsertedChecks ?? []) as EligibilityRow[]) {
      eligibilityByKey.set(`${check.campaign_id}:${check.zone_id}:${check.device_id}`, check);
    }
  }

  const { data: existingPayoutRows, error: existingPayoutError } = await supabase
    .from("reward_payouts")
    .select("id, campaign_id, zone_id, device_id, payout_hour, amount, status, eligibility_check_id, created_at")
    .in("campaign_id", campaignIds)
    .eq("payout_hour", payoutHourIso);

  if (existingPayoutError) {
    return NextResponse.json({ error: existingPayoutError.message }, { status: 400 });
  }

  const existingPayoutKeys = new Set(
    ((existingPayoutRows ?? []) as Database["public"]["Tables"]["reward_payouts"]["Row"][]).map(
      (row) => `${row.campaign_id}:${row.zone_id}:${row.device_id}`
    )
  );

  const existingSpendByCampaign = new Map<string, number>();
  const { data: aggregatePayouts, error: aggregatePayoutError } = await supabase
    .from("reward_payouts")
    .select("campaign_id, amount")
    .in("campaign_id", campaignIds);

  if (aggregatePayoutError) {
    return NextResponse.json({ error: aggregatePayoutError.message }, { status: 400 });
  }

  for (const payout of aggregatePayouts ?? []) {
    existingSpendByCampaign.set(
      payout.campaign_id,
      (existingSpendByCampaign.get(payout.campaign_id) ?? 0) + payout.amount
    );
  }

  const payoutsToInsert: PayoutInsert[] = [];
  const ledgerEntries: LedgerInsert[] = [];
  const campaignSummaries = activeCampaigns.map((campaign) => {
    const campaignEvaluations = evaluated.filter((item) => item.campaignId === campaign.id);
    const existingSpent = existingSpendByCampaign.get(campaign.id) ?? 0;
    let remainingBudget = Math.max(0, campaign.budget_limit - existingSpent);
    let insertedCount = 0;
    let insertedAmount = 0;
    let exhaustedZoneCount = 0;

    const zoneGroups = new Map<string, EvaluatedEnrollment[]>();
    for (const item of campaignEvaluations) {
      if (!item.isEligible) continue;
      const group = zoneGroups.get(item.zoneId) ?? [];
      group.push(item);
      zoneGroups.set(item.zoneId, group);
    }

    for (const zoneItems of zoneGroups.values()) {
      const orderedZoneItems = [...zoneItems].sort((left, right) => left.deviceId.localeCompare(right.deviceId));
      const zoneKey = `${campaign.id}:${orderedZoneItems[0]?.zoneId ?? ""}`;

      if (campaign.hourly_reward_amount > remainingBudget) {
        exhaustedZoneCount += 1;
        for (const item of orderedZoneItems) {
          const dedupeKey = `${item.campaignId}:${item.zoneId}:${item.deviceId}`;
          const existingCheck = eligibilityByKey.get(dedupeKey);
          if (!existingCheck) continue;
          eligibilityByKey.set(dedupeKey, {
            ...existingCheck,
            is_eligible: false,
            reason_code: "budget_exhausted",
            detail: {
              ...(typeof existingCheck.detail === "object" && !Array.isArray(existingCheck.detail)
                ? existingCheck.detail
                : {}),
              payoutHour: payoutHourIso,
              remainingBudget: Number(remainingBudget.toFixed(2)),
              requiredAmount: campaign.hourly_reward_amount,
              splitDeviceCount: orderedZoneItems.length
            }
          });
        }
        continue;
      }

      const zoneAmountCents = Math.round(campaign.hourly_reward_amount * 100);
      const baseShareCents = Math.floor(zoneAmountCents / orderedZoneItems.length);
      let remainderCents = zoneAmountCents - baseShareCents * orderedZoneItems.length;

      for (const item of orderedZoneItems) {
        const dedupeKey = `${item.campaignId}:${item.zoneId}:${item.deviceId}`;
        if (existingPayoutKeys.has(dedupeKey)) {
          continue;
        }

        const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
        if (remainderCents > 0) remainderCents -= 1;
        const shareAmount = shareCents / 100;
        const eligibilityCheck = eligibilityByKey.get(dedupeKey);

        payoutsToInsert.push({
          campaign_id: item.campaignId,
          zone_id: item.zoneId,
          device_id: item.deviceId,
          payout_hour: payoutHourIso,
          amount: shareAmount,
          status: "recorded",
          eligibility_check_id: eligibilityCheck?.id ?? null
        });
        existingPayoutKeys.add(dedupeKey);
        insertedCount += 1;
        insertedAmount += shareAmount;
      }

      remainingBudget -= campaign.hourly_reward_amount;

      for (const item of orderedZoneItems) {
        const dedupeKey = `${item.campaignId}:${item.zoneId}:${item.deviceId}`;
        const existingCheck = eligibilityByKey.get(dedupeKey);
        if (!existingCheck) continue;
        eligibilityByKey.set(dedupeKey, {
          ...existingCheck,
          detail: {
            ...(typeof existingCheck.detail === "object" && !Array.isArray(existingCheck.detail)
              ? existingCheck.detail
              : {}),
            splitDeviceCount: orderedZoneItems.length,
            zoneRewardAmount: campaign.hourly_reward_amount
          }
        });
      }
    }

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      insertedCount,
      insertedAmount: Number(insertedAmount.toFixed(2)),
      exhaustedZoneCount,
      finalSpentBudget: Number((existingSpent + insertedAmount).toFixed(2))
    };
  });

  const budgetExhaustedUpdates: EligibilityInsert[] = Array.from(eligibilityByKey.values())
    .filter((item) => item.reason_code === "budget_exhausted")
    .map((item) => ({
      campaign_id: item.campaign_id,
      zone_id: item.zone_id,
      device_id: item.device_id,
      check_hour: item.check_hour,
      is_eligible: false,
      reason_code: "budget_exhausted",
      detail: item.detail
    }));

  if (budgetExhaustedUpdates.length > 0) {
    const { error: budgetReasonError } = await supabase
      .from("eligibility_checks")
      .upsert(budgetExhaustedUpdates, {
        onConflict: "campaign_id,zone_id,device_id,check_hour"
      });

    if (budgetReasonError) {
      return NextResponse.json({ error: budgetReasonError.message }, { status: 400 });
    }
  }

  let insertedPayoutRows: Database["public"]["Tables"]["reward_payouts"]["Row"][] = [];
  if (payoutsToInsert.length > 0) {
    const { data: payoutRows, error: payoutError } = await supabase
      .from("reward_payouts")
      .upsert(payoutsToInsert, {
        onConflict: "campaign_id,zone_id,device_id,payout_hour"
      })
      .select("id, campaign_id, zone_id, device_id, payout_hour, amount, status, eligibility_check_id, created_at");

    if (payoutError) {
      return NextResponse.json({ error: payoutError.message }, { status: 400 });
    }

    insertedPayoutRows = (payoutRows ?? []) as Database["public"]["Tables"]["reward_payouts"]["Row"][];
    for (const payout of insertedPayoutRows) {
      ledgerEntries.push({
        campaign_id: payout.campaign_id,
        entry_type: "payout",
        amount: payout.amount,
        reference_type: "payout",
        reference_id: payout.id,
        note: `Hourly payout for ${payout.payout_hour}`
      });
    }
  }

  if (ledgerEntries.length > 0) {
    const { error: ledgerError } = await supabase.from("campaign_budget_ledger").insert(ledgerEntries);
    if (ledgerError) {
      return NextResponse.json({ error: ledgerError.message }, { status: 400 });
    }
  }

  const { data: refreshedAggregatePayouts, error: refreshedAggregatePayoutError } = await supabase
    .from("reward_payouts")
    .select("campaign_id, amount")
    .in("campaign_id", campaignIds);

  if (refreshedAggregatePayoutError) {
    return NextResponse.json({ error: refreshedAggregatePayoutError.message }, { status: 400 });
  }

  const refreshedSpendByCampaign = new Map<string, number>();
  for (const payout of refreshedAggregatePayouts ?? []) {
    refreshedSpendByCampaign.set(
      payout.campaign_id,
      (refreshedSpendByCampaign.get(payout.campaign_id) ?? 0) + payout.amount
    );
  }

  for (const summary of campaignSummaries) {
    summary.finalSpentBudget = Number((refreshedSpendByCampaign.get(summary.campaignId) ?? 0).toFixed(2));
    const { error: updateError } = await supabase
      .from("sponsor_campaigns")
      .update({ spent_budget: summary.finalSpentBudget })
      .eq("id", summary.campaignId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    payoutHour: payoutHourIso,
    activeCampaignCount: activeCampaigns.length,
    processedCampaignCount: campaignSummaries.length,
    eligibilityCheckCount: eligibilityPayload.length,
    payoutCount: insertedPayoutRows.length,
    totalAmount: Number(insertedPayoutRows.reduce((sum, item) => sum + item.amount, 0).toFixed(2)),
    campaigns: campaignSummaries
  });
}
