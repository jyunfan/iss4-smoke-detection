"use client";

import { useEffect, useMemo, useState } from "react";

type RewardItem = {
  id: string;
  campaign_id: string;
  zone_id: string;
  device_id: string;
  payout_hour: string;
  amount: number;
  status: string;
  created_at: string;
};

type RewardsResponse = {
  items: RewardItem[];
  ownerId: string;
};

export function OwnerRewardsClient() {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRewards() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/owner/rewards", { cache: "no-store" });
    const payload = (await response.json()) as RewardsResponse | { error?: string };

    if (!response.ok || !("items" in payload)) {
      setError("Failed to load rewards.");
      setLoading(false);
      return;
    }

    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    void loadRewards();
  }, []);

  const totalAmount = useMemo(
    () => (data?.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0),
    [data]
  );

  const uniqueZones = useMemo(() => new Set((data?.items ?? []).map((item) => item.zone_id)).size, [data]);

  return (
    <div className="stack">
      <section className="hero-panel owner-hero stack">
        <div className="row spread align-start">
          <div className="stack tight">
            <p className="eyebrow">Earnings</p>
            <h1>Reward History</h1>
            <p className="muted max-copy">
              Track payout rows written for your enrolled devices. This page reflects the owner-facing reward ledger
              already exposed by the current API.
            </p>
          </div>
          <button className="btn" type="button" onClick={() => void loadRewards()} disabled={loading}>
            Refresh
          </button>
        </div>
      </section>

      <div className="metric-strip metrics-3">
        <div className="metric-box">
          <span>Payout Rows</span>
          <strong>{data?.items.length ?? 0}</strong>
        </div>
        <div className="metric-box">
          <span>Total Earned</span>
          <strong>${totalAmount.toFixed(2)}</strong>
        </div>
        <div className="metric-box">
          <span>Zones Paid</span>
          <strong>{uniqueZones}</strong>
        </div>
      </div>

      <section className="panel stack">
        <div className="stack tight">
          <p className="eyebrow">Ledger</p>
          <h2>Recent Reward Rows</h2>
        </div>

        {loading ? <p className="muted">Loading rewards...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && !error && (data?.items.length ?? 0) === 0 ? <p className="muted">No rewards recorded yet.</p> : null}

        {!loading && !error && (data?.items.length ?? 0) > 0 ? (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payout Hour</th>
                  <th>Campaign</th>
                  <th>Zone</th>
                  <th>Device</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.payout_hour).toLocaleString()}</td>
                    <td>
                      <code>{item.campaign_id.slice(0, 8)}</code>
                    </td>
                    <td>
                      <code>{item.zone_id.slice(0, 8)}</code>
                    </td>
                    <td>
                      <code>{item.device_id.slice(0, 8)}</code>
                    </td>
                    <td>${Number(item.amount).toFixed(2)}</td>
                    <td>
                      <span className={`pill status-${item.status}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
