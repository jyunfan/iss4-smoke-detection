import Link from "next/link";
import { requirePageRole } from "@/lib/auth/page-guards";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePageRole(["sensor_owner"]);

  return (
    <main className="stack">
      <header className="panel row">
        <strong>Owner Portal</strong>
        <span className="pill">{auth.displayName ?? "Sensor Owner"}</span>
        <Link href="/owner/dashboard">Dashboard</Link>
        <Link href="/owner/devices">Devices</Link>
        <Link href="/owner/zones">Zones</Link>
        <Link href="/owner/rewards">Rewards</Link>
        <Link href="/api/auth/signout">Sign out</Link>
      </header>
      {children}
    </main>
  );
}
