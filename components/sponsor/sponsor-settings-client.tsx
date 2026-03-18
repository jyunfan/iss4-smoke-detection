"use client";

import { useEffect, useState, useTransition } from "react";

type CampaignSettings = {
  id: string;
  name: string;
  status: string;
  hourly_reward_amount: number;
  budget_limit: number;
  spent_budget: number;
  updated_at?: string;
};

type FormState = {
  hourlyRewardAmount: string;
  budgetLimit: string;
  status: string;
};

export function SponsorSettingsClient({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CampaignSettings | null>(null);
  const [form, setForm] = useState<FormState>({
    hourlyRewardAmount: "",
    budgetLimit: "",
    status: "draft"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadCampaign() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/sponsor/campaigns/${campaignId}/settings`, { cache: "no-store" });
    const data = (await response.json()) as { item?: CampaignSettings; error?: string };

    if (!response.ok || !data.item) {
      setError(data.error ?? "Failed to load settings.");
      setLoading(false);
      return;
    }

    setCampaign(data.item);
    setForm({
      hourlyRewardAmount: String(data.item.hourly_reward_amount),
      budgetLimit: String(data.item.budget_limit),
      status: data.item.status
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadCampaign();
  }, [campaignId]);

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/sponsor/campaigns/${campaignId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRewardAmount: Number(form.hourlyRewardAmount),
          budgetLimit: Number(form.budgetLimit),
          status: form.status
        })
      });

      const data = (await response.json()) as { item?: CampaignSettings; error?: string };

      if (!response.ok || !data.item) {
        setError(data.error ?? "Failed to update settings.");
        return;
      }

      setCampaign(data.item);
      setMessage("Settings updated.");
    });
  }

  return (
    <div className="stack">
      <section className="hero-panel stack">
        <p className="eyebrow">Budget Control</p>
        <h1>Campaign Settings</h1>
        <p className="muted max-copy">
          Update reward velocity, total budget ceiling, and run-state for the selected campaign through the
          sponsor settings API.
        </p>
      </section>

      <div className="dashboard-two-col">
        <section className="panel stack">
          <div className="stack tight">
            <p className="eyebrow">Snapshot</p>
            <h2>{campaign?.name ?? "Campaign"}</h2>
          </div>

          {loading ? <p className="muted">Loading campaign settings...</p> : null}

          {campaign ? (
            <div className="stack">
              <div className="metric-box wide">
                <span>Current Status</span>
                <strong>{campaign.status}</strong>
              </div>
              <div className="metric-box wide">
                <span>Spent Budget</span>
                <strong>${campaign.spent_budget.toFixed(2)}</strong>
              </div>
              <p className="muted small-text">
                Last updated {campaign.updated_at ? new Date(campaign.updated_at).toLocaleString() : "recently"}
              </p>
            </div>
          ) : null}
        </section>

        <section className="panel stack">
          <div className="stack tight">
            <p className="eyebrow">Edit</p>
            <h2>Reward Parameters</h2>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="stack tight">
              <span>Hourly Reward Amount</span>
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

            <label className="stack tight">
              <span>Status</span>
              <select className="input" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </label>

            <button className="btn primary" type="submit" disabled={isPending || loading}>
              {isPending ? "Saving..." : "Update Settings"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </section>
      </div>
    </div>
  );
}
