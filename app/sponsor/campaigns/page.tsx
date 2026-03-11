import Link from "next/link";

const SAMPLE_CAMPAIGN_ID = "00000000-0000-0000-0000-000000000000";

export default function SponsorCampaignsPage() {
  return (
    <section className="panel stack">
      <h1>Campaigns</h1>
      <p className="muted">Use <code>/api/sponsor/campaigns</code> to list and create campaigns.</p>
      <div className="row">
        <Link href={`/sponsor/campaigns/${SAMPLE_CAMPAIGN_ID}/zones`}>Open Zones</Link>
        <Link href={`/sponsor/campaigns/${SAMPLE_CAMPAIGN_ID}/settings`}>Open Settings</Link>
        <Link href={`/sponsor/campaigns/${SAMPLE_CAMPAIGN_ID}/rewards`}>Open Rewards</Link>
      </div>
    </section>
  );
}
