"use client";

import { useEffect, useState, useTransition } from "react";
import { SENSOR_PROVIDERS, SENSOR_PROVIDER_LABELS, getSensorProviderLabel } from "@/lib/sensors/providers";

type DeviceItem = {
  id: string;
  external_device_id: string;
  provider: string;
  nickname: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

type DevicesResponse = {
  items: DeviceItem[];
};

const INITIAL_FORM = {
  externalDeviceId: "",
  provider: "purpleair",
  nickname: ""
};

export function OwnerDevicesClient() {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadDevices() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/owner/devices", { cache: "no-store" });
    const data = (await response.json()) as DevicesResponse | { error?: string };

    if (!response.ok || !("items" in data)) {
      setError("Failed to load devices.");
      setLoading(false);
      return;
    }

    setDevices(data.items);
    setLoading(false);
  }

  useEffect(() => {
    void loadDevices();
  }, []);

  function updateField(name: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/owner/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalDeviceId: form.externalDeviceId,
          provider: form.provider,
          nickname: form.nickname || undefined
        })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to register device.");
        return;
      }

      setForm(INITIAL_FORM);
      setMessage("Device registered.");
      await loadDevices();
    });
  }

  return (
    <div className="stack">
      <section className="hero-panel owner-hero stack">
        <div className="row spread align-start">
          <div className="stack tight">
            <p className="eyebrow">Sensor Fleet</p>
            <h1>My Devices</h1>
            <p className="muted max-copy">
              Register PurpleAir or AirGradient devices, confirm which sensors are active, and keep your
              participation footprint visible before joining any reward zone.
            </p>
          </div>
          <div className="metric-box">
            <span>Registered Devices</span>
            <strong>{devices.length}</strong>
          </div>
        </div>
      </section>

      <div className="dashboard-two-col">
        <section className="panel stack">
          <div className="stack tight">
            <p className="eyebrow">Register</p>
            <h2>Add Device</h2>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="stack tight">
              <span>External Device ID</span>
              <input
                className="input"
                value={form.externalDeviceId}
                onChange={(event) => updateField("externalDeviceId", event.target.value)}
                required
              />
            </label>

            <label className="stack tight">
              <span>Provider</span>
              <select className="input" value={form.provider} onChange={(event) => updateField("provider", event.target.value)}>
                {SENSOR_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {SENSOR_PROVIDER_LABELS[provider]}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack tight">
              <span>Nickname</span>
              <input className="input" value={form.nickname} onChange={(event) => updateField("nickname", event.target.value)} />
            </label>

            <button className="btn primary" type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Register Device"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </section>

        <section className="panel stack">
          <div className="row spread">
            <div className="stack tight">
              <p className="eyebrow">Inventory</p>
              <h2>Registered Devices</h2>
            </div>
            <button className="btn" type="button" onClick={() => void loadDevices()} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? <p className="muted">Loading devices...</p> : null}
          {!loading && devices.length === 0 ? <p className="muted">No devices registered yet.</p> : null}

          <div className="stack">
            {devices.map((device) => (
              <article className="campaign-card" key={device.id}>
                <div className="row spread align-start">
                  <div className="stack tight">
                    <div className="row align-center">
                      <h3>{device.nickname || device.external_device_id}</h3>
                      <span className="pill">{device.status}</span>
                    </div>
                    <p className="muted small-text">
                      Provider {getSensorProviderLabel(device.provider)} · External ID <code>{device.external_device_id}</code>
                    </p>
                  </div>
                  <div className="right-text">
                    <p className="muted small-text">
                      Last seen {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "not yet"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
