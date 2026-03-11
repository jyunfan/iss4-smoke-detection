import Link from "next/link";

export default function HomePage() {
  return (
    <main className="stack">
      <section className="panel stack">
        <h1>ISS4 Hybrid Skeleton</h1>
        <p className="muted">
          This scaffold includes role-based pages and API endpoints for <code>sensor_owner</code> and{" "}
          <code>sponsor</code>.
        </p>
        <div className="row">
          <Link className="btn" href="/login">
            Login
          </Link>
          <Link className="btn" href="/owner/dashboard">
            Owner Dashboard
          </Link>
          <Link className="btn" href="/sponsor/dashboard">
            Sponsor Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
