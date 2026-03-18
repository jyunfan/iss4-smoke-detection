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

type RewardResponse = {
  items: RewardItem[];
  summary: {
    totalRows: number;
    totalAmount: number;
  };
};

export function SponsorRewardsClient({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<RewardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRewards() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/sponsor/campaigns/${campaignId}/rewards?limit=100`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as RewardResponse | { error?: string };

    if (!response.ok || !("items" in payload)) {
      setError("Failed to load reward history.");
      setLoading(false);
      return;
    }

    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    void loadRewards();
  }, [campaignId]);

  const uniqueDevices = useMemo(() => {
    return new Set(data?.items.map((item) => item.device_id) ?? []).size;
  }, [data]);

  const latestHour = data?.items[0]?.payout_hour ?? null;

  return (
    <div className="stack">
      <section className="hero-panel stack">
        <div className="row spread align-start">
          <div className="stack tight">
            <p className="eyebrow">Payout Ledger</p>
            <h1>Reward History</h1>
            <p className="muted max-copy">
              Review recent payout rows generated for this campaign. This screen reads directly from the sponsor
              rewards API and surfaces lightweight ledger metrics.
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
          <strong>{data?.summary.totalRows ?? 0}</strong>
        </div>
        <div className="metric-box">
          <span>Total Amount</span>
          <strong>${(data?.summary.totalAmount ?? 0).toFixed(2)}</strong>
        </div>
        <div className="metric-box">
          <span>Distinct Devices</span>
          <strong>{uniqueDevices}</strong>
        </div>
      </div>

      <section className="panel stack">
        <div className="row spread align-start">
          <div className="stack tight">
            <p className="eyebrow">Latest Batch</p>
            <h2>Recent Payout Records</h2>
          </div>
          <span className="pill">{latestHour ? new Date(latestHour).toLocaleString() : "No payouts yet"}</span>
        </div>

        {loading ? <p className="muted">Loading reward rows...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && !error && (data?.items.length ?? 0) === 0 ? (
          <p className="muted">No payout records have been written for this campaign yet.</p>
        ) : null}

        {!loading && !error && data && data.items.length > 0 ? (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payout Hour</th>
                  <th>Zone ID</th>
                  <th>Device ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.payout_hour).toLocaleString()}</td>
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
                    <td>{new Date(item.created_at).toLocaleString()}</td>
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
