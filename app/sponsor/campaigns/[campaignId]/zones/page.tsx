import { SponsorZonesClient } from "@/components/sponsor/sponsor-zones-client";

type Props = {
  params: Promise<{ campaignId: string }>;
};

export default async function SponsorCampaignZonesPage({ params }: Props) {
  const { campaignId } = await params;

  return (
    <SponsorZonesClient campaignId={campaignId} />
  );
}
