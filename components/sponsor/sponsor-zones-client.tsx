"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

type ZoneItem = {
  id: string;
  campaign_id: string;
  name: string;
  center_lon: number;
  center_lat: number;
  radius_meters: number;
  is_active: boolean;
  updated_at?: string;
  created_at?: string;
};

type ZoneFormState = {
  zoneId: string | null;
  name: string;
  centerLon: string;
  centerLat: string;
  radiusMeters: string;
};

const EMPTY_FORM: ZoneFormState = {
  zoneId: null,
  name: "",
  centerLon: "",
  centerLat: "",
  radiusMeters: "1500"
};

export function SponsorZonesClient({ campaignId }: { campaignId: string }) {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadZones() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/sponsor/campaigns/${campaignId}/zones`, { cache: "no-store" });
    const data = (await response.json()) as { items?: ZoneItem[]; error?: string };

    if (!response.ok || !data.items) {
      setError(data.error ?? "Failed to load zones.");
      setLoading(false);
      return;
    }

    setZones(data.items);
    setLoading(false);
  }

  useEffect(() => {
    void loadZones();
  }, [campaignId]);

  const selectedZone = useMemo(
    () => zones.find((item) => item.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  useEffect(() => {
    if (!selectedZone) {
      return;
    }

    setForm({
      zoneId: selectedZone.id,
      name: selectedZone.name,
      centerLon: String(selectedZone.center_lon),
      centerLat: String(selectedZone.center_lat),
      radiusMeters: String(selectedZone.radius_meters)
    });
  }, [selectedZone]);

  function resetForm() {
    setSelectedZoneId(null);
    setForm(EMPTY_FORM);
  }

  function updateField(name: keyof ZoneFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const method = form.zoneId ? "PATCH" : "POST";
      const response = await fetch(`/api/sponsor/campaigns/${campaignId}/zones`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(form.zoneId ? { zoneId: form.zoneId } : {}),
          name: form.name,
          centerLon: Number(form.centerLon),
          centerLat: Number(form.centerLat),
          radiusMeters: Number(form.radiusMeters)
        })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to save zone.");
        return;
      }

      setMessage(form.zoneId ? "Zone updated." : "Zone created.");
      resetForm();
      await loadZones();
    });
  }

  return (
    <div className="stack">
      <section className="hero-panel stack">
        <p className="eyebrow">Reward Geography</p>
        <h1>Zone Editor</h1>
        <p className="muted max-copy">
          Shape the target coverage with explicit coordinates and radius values. This view uses the sponsor
          zone API directly for create and update actions.
        </p>
      </section>

      <div className="dashboard-two-col">
        <section className="panel stack">
          <div className="row spread">
            <div className="stack tight">
              <p className="eyebrow">Zone List</p>
              <h2>Campaign Zones</h2>
            </div>
            <button className="btn" type="button" onClick={resetForm}>
              New Zone
            </button>
          </div>

          {loading ? <p className="muted">Loading zones...</p> : null}
          {!loading && zones.length === 0 ? <p className="muted">No zones yet.</p> : null}

          <div className="stack">
            {zones.map((zone) => (
              <button
                className={`select-card ${selectedZoneId === zone.id ? "selected" : ""}`}
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
              >
                <div className="row spread align-start">
                  <div className="stack tight left-text">
                    <strong>{zone.name}</strong>
                    <span className="muted small-text">
                      {zone.center_lat.toFixed(4)}, {zone.center_lon.toFixed(4)}
                    </span>
                  </div>
                  <span className="pill">{zone.is_active ? "active" : "inactive"}</span>
                </div>
                <span className="muted small-text">Radius {zone.radius_meters.toLocaleString()} m</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="stack tight">
            <p className="eyebrow">{form.zoneId ? "Edit" : "Create"}</p>
            <h2>{form.zoneId ? "Update Zone" : "New Zone"}</h2>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="stack tight">
              <span>Name</span>
              <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>

            <div className="grid-2">
              <label className="stack tight">
                <span>Longitude</span>
                <input
                  className="input"
                  type="number"
                  step="0.000001"
                  value={form.centerLon}
                  onChange={(event) => updateField("centerLon", event.target.value)}
                  required
                />
              </label>

              <label className="stack tight">
                <span>Latitude</span>
                <input
                  className="input"
                  type="number"
                  step="0.000001"
                  value={form.centerLat}
                  onChange={(event) => updateField("centerLat", event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="stack tight">
              <span>Radius (meters)</span>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={form.radiusMeters}
                onChange={(event) => updateField("radiusMeters", event.target.value)}
                required
              />
            </label>

            <div className="row">
              <button className="btn primary" type="submit" disabled={isPending}>
                {isPending ? "Saving..." : form.zoneId ? "Update Zone" : "Create Zone"}
              </button>
              <button className="btn" type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </section>
      </div>
    </div>
  );
}
