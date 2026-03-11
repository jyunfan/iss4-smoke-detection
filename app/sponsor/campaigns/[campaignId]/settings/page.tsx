type Props = {
  params: Promise<{ campaignId: string }>;
};

export default async function SponsorCampaignSettingsPage({ params }: Props) {
  const { campaignId } = await params;

  return (
    <section className="panel stack">
      <h1>Campaign Settings</h1>
      <p className="muted">
        Campaign: <code>{campaignId}</code>
      </p>
      <p className="muted">
        Use <code>/api/sponsor/campaigns/[campaignId]/settings</code> to update reward amount and budget.
      </p>
    </section>
  );
}
