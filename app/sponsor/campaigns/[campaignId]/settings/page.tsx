import { SponsorSettingsClient } from "@/components/sponsor/sponsor-settings-client";

type Props = {
  params: Promise<{ campaignId: string }>;
};

export default async function SponsorCampaignSettingsPage({ params }: Props) {
  const { campaignId } = await params;

  return (
    <SponsorSettingsClient campaignId={campaignId} />
  );
}
