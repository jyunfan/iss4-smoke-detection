type Props = {
  params: Promise<{ campaignId: string }>;
};

export default async function SponsorCampaignRewardsPage({ params }: Props) {
  const { campaignId } = await params;

  return (
    <section className="panel stack">
      <h1>Campaign Reward Records</h1>
      <p className="muted">
        Campaign: <code>{campaignId}</code>
      </p>
      <p className="muted">
        Use <code>/api/sponsor/campaigns/[campaignId]/rewards</code> to read payout history and summaries.
      </p>
    </section>
  );
}
