"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { FormEvent } from "react";

type RoleChoice = "sensor_owner" | "sponsor";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<RoleChoice>("sensor_owner");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function bootstrapProfile(chosenRole: RoleChoice, chosenName?: string) {
    const response = await fetch("/api/auth/bootstrap-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: chosenRole,
        displayName: chosenName && chosenName.trim() ? chosenName.trim() : undefined
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error ?? "Failed to initialize profile.");
    }
    return data as { redirectTo: string };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                requested_role: role,
                full_name: displayName || undefined
              }
            }
          });

          if (signUpError) throw signUpError;

          if (!data.session) {
            setMessage("Sign-up succeeded. Please confirm your email, then sign in.");
            return;
          }

          const profile = await bootstrapProfile(role, displayName);
          router.push(profile.redirectTo);
          router.refresh();
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        const bootstrapRole = (searchParams.get("role") as RoleChoice) || role;
        const profile = await bootstrapProfile(bootstrapRole, displayName);
        router.push(profile.redirectTo);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected auth error.";
        setError(msg);
      }
    });
  }

  return (
    <main className="stack">
      <section className="panel stack">
        <h1>Login / Sign Up</h1>
        <p className="muted">
          Authenticate with Supabase Auth, then bootstrap <code>app_users</code>.
        </p>

        <div className="row">
          <button type="button" className={`btn ${mode === "signin" ? "primary" : ""}`} onClick={() => setMode("signin")}>
            Sign In
          </button>
          <button type="button" className={`btn ${mode === "signup" ? "primary" : ""}`} onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </div>

        <form className="stack" onSubmit={onSubmit}>
          <label className="stack">
            <span>Email</span>
            <input
              className="btn"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="stack">
            <span>Password</span>
            <input
              className="btn"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="stack">
            <span>Display Name (optional)</span>
            <input
              className="btn"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <label className="stack">
            <span>Role</span>
            <select className="btn" value={role} onChange={(e) => setRole(e.target.value as RoleChoice)}>
              <option value="sensor_owner">Sensor Owner</option>
              <option value="sponsor">Sponsor</option>
            </select>
          </label>

          <button className="btn primary" type="submit" disabled={isPending}>
            {isPending ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        {message ? <p>{message}</p> : null}
        {error ? <p style={{ color: "#b12020" }}>{error}</p> : null}
        {searchParams.get("reason") === "bootstrap" ? (
          <p className="muted">Session found but app profile missing. Sign in again to initialize profile.</p>
        ) : null}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="stack">
          <section className="panel stack">
            <h1>Login / Sign Up</h1>
            <p className="muted">Loading...</p>
          </section>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
