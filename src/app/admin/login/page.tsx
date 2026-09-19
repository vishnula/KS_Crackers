"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const password = new FormData(event.currentTarget).get("password");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Could not sign in");
        setBusy(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network problem. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-black text-text">Sign in</h1>
      <p className="mt-2 text-[14px] text-muted">Orders and payments for the shop.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] text-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-text outline-none focus:border-gold"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-ember/40 bg-ember/10 p-3 text-[13.5px] text-ember">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-xl bg-gold text-[15px] font-bold text-[#1a1200] disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
