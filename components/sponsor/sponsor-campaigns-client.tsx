"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type CampaignItem = {
  id: string;
  name: string;
  status: string;
  hourly_reward_amount: number;
  budget_limit: number;
  spent_budget: number;
  created_at: string;
};

type CampaignResponse = {
  items: CampaignItem[];
};

const INITIAL_FORM = {
  name: "",
  description: "",
  hourlyRewardAmount: "25",
  budgetLimit: "5000",
  status: "draft"
};

export function SponsorCampaignsClient() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCampaigns() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/sponsor/campaigns", { cache: "no-store" });
    const data = (await response.json()) as CampaignResponse | { error?: string };

    if (!response.ok || !("items" in data)) {
      setError("Failed to load campaigns.");
      setLoading(false);
      return;
    }

    setCampaigns(data.items);
    setLoading(false);
  }

  useEffect(() => {
    void loadCampaigns();
  }, []);

  function updateField(name: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/sponsor/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          hourlyRewardAmount: Number(form.hourlyRewardAmount),
          budgetLimit: Number(form.budgetLimit),
          status: form.status
        })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to create campaign.");
        return;
      }

      setMessage("Campaign created.");
      setForm(INITIAL_FORM);
      await loadCampaigns();
    });
  }

  return (
    <div className="stack">
      <section className="hero-panel stack">
        <div className="row spread">
          <div className="stack tight">
            <p className="eyebrow">Sponsor Control</p>
            <h1>Campaign Studio</h1>
            <p className="muted max-copy">
              Create campaigns, set a budget envelope, and route into zone editing or reward settings
              without leaving the sponsor workflow.
            </p>
          </div>
          <div className="metric-strip">
            <div className="metric-box">
              <span>Total Campaigns</span>
              <strong>{campaigns.length}</strong>
            </div>
            <div className="metric-box">
              <span>Active</span>
              <strong>{campaigns.filter((item) => item.status === "active").length}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-two-col">
        <section className="panel stack">
          <div className="stack tight">
            <p className="eyebrow">Create</p>
            <h2>New Campaign</h2>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="stack tight">
              <span>Name</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>

            <label className="stack tight">
              <span>Description</span>
              <textarea
                className="input textarea"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={4}
              />
            </label>

            <div className="grid-2">
              <label className="stack tight">
                <span>Hourly Reward</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.hourlyRewardAmount}
                  onChange={(event) => updateField("hourlyRewardAmount", event.target.value)}
                  required
                />
              </label>

              <label className="stack tight">
                <span>Budget Limit</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budgetLimit}
                  onChange={(event) => updateField("budgetLimit", event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="stack tight">
              <span>Status</span>
              <select className="input" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </label>

            <button className="btn primary" type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Campaign"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </section>

        <section className="panel stack">
          <div className="row spread">
            <div className="stack tight">
              <p className="eyebrow">Manage</p>
              <h2>Existing Campaigns</h2>
            </div>
            <button className="btn" type="button" onClick={() => void loadCampaigns()} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? <p className="muted">Loading campaigns...</p> : null}
          {!loading && campaigns.length === 0 ? <p className="muted">No campaigns yet.</p> : null}

          <div className="stack">
            {campaigns.map((campaign) => (
              <article className="campaign-card" key={campaign.id}>
                <div className="row spread align-start">
                  <div className="stack tight">
                    <div className="row align-center">
                      <h3>{campaign.name}</h3>
                      <span className="pill">{campaign.status}</span>
                    </div>
                    <p className="muted small-text">Created {new Date(campaign.created_at).toLocaleString()}</p>
                  </div>
                  <div className="stack tight right-text">
                    <strong>${campaign.hourly_reward_amount.toFixed(2)}/hr</strong>
                    <span className="muted small-text">
                      Budget ${campaign.budget_limit.toFixed(2)} / Spent ${campaign.spent_budget.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="row">
                  <Link className="btn" href={`/sponsor/campaigns/${campaign.id}/zones`}>
                    Zones
                  </Link>
                  <Link className="btn" href={`/sponsor/campaigns/${campaign.id}/settings`}>
                    Settings
                  </Link>
                  <Link className="btn" href={`/sponsor/campaigns/${campaign.id}/rewards`}>
                    Rewards
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
