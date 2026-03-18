import { SponsorRewardsClient } from "@/components/sponsor/sponsor-rewards-client";

type Props = {
  params: Promise<{ campaignId: string }>;
};

export default async function SponsorCampaignRewardsPage({ params }: Props) {
  const { campaignId } = await params;

  return <SponsorRewardsClient campaignId={campaignId} />;
}
