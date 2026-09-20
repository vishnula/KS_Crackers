"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "unsupported" | "off" | "on" | "blocked";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  // Returns the state rather than setting it, so nothing is set synchronously
  // inside the effect body (react-hooks/set-state-in-effect).
  const currentState = useCallback(async (): Promise<State> => {
    if (
      !publicKey ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return "unsupported";
    if (Notification.permission === "denied") return "blocked";

    const registration = await navigator.serviceWorker.getRegistration();
    const existing = await registration?.pushManager.getSubscription();
    return existing ? "on" : "off";
  }, [publicKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await currentState();
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentState]);

  async function enable() {
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Could not save the subscription");
        return;
      }
      setState("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable alerts");
    }
  }

  async function disable() {
    setError("");
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await fetch("/api/admin/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    setState("off");
  }

  if (state === "loading") return null;

  if (state === "unsupported")
    return (
      <p className="rounded-xl border border-line bg-surface p-3 text-[12.5px] text-muted">
        Order alerts are not available in this browser. Open the admin panel in Chrome
        on your phone and add it to the home screen.
      </p>
    );

  if (state === "blocked")
    return (
      <p className="rounded-xl border border-ember/40 bg-ember/10 p-3 text-[12.5px] text-ember">
        Notifications are blocked for this site. Allow them in your browser settings to
        get order alerts.
      </p>
    );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={state === "on" ? disable : enable}
        className={`h-11 rounded-xl px-4 text-[14px] font-bold ${
          state === "on"
            ? "border border-good/50 bg-good/10 text-good"
            : "bg-gold text-[#1a1200]"
        }`}
      >
        {state === "on" ? "Order alerts are on" : "Turn on order alerts"}
      </button>
      {state === "off" && (
        <span className="text-[12.5px] text-muted">
          Get a notification on this phone the moment an order arrives.
        </span>
      )}
      {error && <span className="text-[12.5px] text-ember">{error}</span>}
    </div>
  );
}
