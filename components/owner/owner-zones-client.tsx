"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

type DeviceItem = {
  id: string;
  nickname: string | null;
  external_device_id: string;
  status: string;
};

type ZoneItem = {
  id: string;
  campaign_id: string;
  campaign_name: string;
  name: string;
  center_lon: number;
  center_lat: number;
  radius_meters: number;
};

type EnrollmentItem = {
  id: string;
  zone_id: string;
  device_id: string;
  status: string;
  joined_at: string;
  left_at: string | null;
};

type ZonesResponse = {
  devices: DeviceItem[];
  availableZones: ZoneItem[];
  enrollments: EnrollmentItem[];
};

export function OwnerZonesClient() {
  const [data, setData] = useState<ZonesResponse | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/owner/zones", { cache: "no-store" });
    const payload = (await response.json()) as ZonesResponse | { error?: string };

    if (!response.ok || !("devices" in payload)) {
      setError("Failed to load zone data.");
      setLoading(false);
      return;
    }

    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!data) return;
    if (!deviceId && data.devices[0]) setDeviceId(data.devices[0].id);
    if (!zoneId && data.availableZones[0]) setZoneId(data.availableZones[0].id);
  }, [data, deviceId, zoneId]);

  const enrollmentKeys = useMemo(() => {
    return new Set((data?.enrollments ?? []).map((item) => `${item.device_id}:${item.zone_id}`));
  }, [data]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/owner/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, zoneId })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Failed to join zone.");
        return;
      }

      setMessage("Zone joined.");
      await loadData();
    });
  }

  return (
    <div className="stack">
      <section className="hero-panel owner-hero stack">
        <p className="eyebrow">Participation</p>
        <h1>Zone Enrollment</h1>
        <p className="muted max-copy">
          Match one of your devices to an active sponsored zone. This page shows the zones exposed by the system and
          your existing enrollments.
        </p>
      </section>

      <div className="dashboard-two-col">
        <section className="panel stack">
          <div className="stack tight">
            <p className="eyebrow">Join</p>
            <h2>Enroll a Device</h2>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="stack tight">
              <span>Device</span>
              <select className="input" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} required>
                <option value="" disabled>
                  Select a device
                </option>
                {(data?.devices ?? []).map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.nickname || device.external_device_id}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack tight">
              <span>Reward Zone</span>
              <select className="input" value={zoneId} onChange={(event) => setZoneId(event.target.value)} required>
                <option value="" disabled>
                  Select a zone
                </option>
                {(data?.availableZones ?? []).map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.campaign_name} / {zone.name}
                  </option>
                ))}
              </select>
            </label>

            <button className="btn primary" type="submit" disabled={isPending || !(data?.devices.length && data?.availableZones.length)}>
              {isPending ? "Joining..." : "Join Zone"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </section>

        <section className="panel stack">
          <div className="row spread">
            <div className="stack tight">
              <p className="eyebrow">Available</p>
              <h2>Active Zones</h2>
            </div>
            <button className="btn" type="button" onClick={() => void loadData()} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? <p className="muted">Loading zones...</p> : null}
          {!loading && (data?.availableZones.length ?? 0) === 0 ? <p className="muted">No active zones available.</p> : null}

          <div className="stack">
            {(data?.availableZones ?? []).map((zone) => {
              const joinedCount = (data?.enrollments ?? []).filter((item) => item.zone_id === zone.id).length;

              return (
                <article className="campaign-card" key={zone.id}>
                  <div className="row spread align-start">
                    <div className="stack tight">
                      <div className="row align-center">
                        <h3>{zone.name}</h3>
                        <span className="pill">{zone.campaign_name}</span>
                      </div>
                      <p className="muted small-text">
                        Center {zone.center_lat.toFixed(4)}, {zone.center_lon.toFixed(4)}
                      </p>
                    </div>
                    <div className="right-text">
                      <strong>{zone.radius_meters.toLocaleString()} m</strong>
                      <p className="muted small-text">{joinedCount} enrollment(s)</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel stack">
        <div className="stack tight">
          <p className="eyebrow">Current</p>
          <h2>My Enrollments</h2>
        </div>

        {!loading && (data?.enrollments.length ?? 0) === 0 ? <p className="muted">You have not joined any zones yet.</p> : null}

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Joined At</th>
              </tr>
            </thead>
            <tbody>
              {(data?.enrollments ?? []).map((item) => {
                const device = data?.devices.find((entry) => entry.id === item.device_id);
                const zone = data?.availableZones.find((entry) => entry.id === item.zone_id);

                return (
                  <tr key={item.id}>
                    <td>{device?.nickname || device?.external_device_id || item.device_id.slice(0, 8)}</td>
                    <td>{zone ? `${zone.campaign_name} / ${zone.name}` : item.zone_id.slice(0, 8)}</td>
                    <td>
                      <span className="pill">{item.status}</span>
                    </td>
                    <td>{new Date(item.joined_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
