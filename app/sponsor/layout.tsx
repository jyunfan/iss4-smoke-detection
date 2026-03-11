import Link from "next/link";
import { requirePageRole } from "@/lib/auth/page-guards";

export default async function SponsorLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePageRole(["sponsor"]);

  return (
    <main className="stack">
      <header className="panel row">
        <strong>Sponsor Portal</strong>
        <span className="pill">{auth.displayName ?? "Sponsor"}</span>
        <Link href="/sponsor/dashboard">Dashboard</Link>
        <Link href="/sponsor/campaigns">Campaigns</Link>
        <Link href="/api/auth/signout">Sign out</Link>
      </header>
      {children}
    </main>
  );
}
