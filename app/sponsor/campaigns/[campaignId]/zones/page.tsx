type Props = {
  params: Promise<{ campaignId: string }>;
};

export default async function SponsorCampaignZonesPage({ params }: Props) {
  const { campaignId } = await params;

  return (
    <section className="panel stack">
      <h1>Campaign Zones</h1>
      <p className="muted">
        Campaign: <code>{campaignId}</code>
      </p>
      <p className="muted">Use <code>/api/sponsor/campaigns/[campaignId]/zones</code> to CRUD reward zones.</p>
    </section>
  );
}
