"use client";

import Link from "next/link";
import { useState } from "react";
import { formatINRPlain } from "@/lib/format";

type Found = {
  orderNo: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  createdAt: string;
  link: string;
};

const STEPS = ["new", "confirmed", "packed", "dispatched", "delivered"];

const LABEL: Record<string, string> = {
  new: "Order received",
  confirmed: "Confirmed with you",
  packed: "Packed",
  dispatched: "Sent by transport",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TrackPage() {
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFound(null);
    setBusy(true);

    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo: data.get("orderNo"),
          mobile: data.get("mobile"),
        }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Could not find that order");
      else setFound(json as Found);
    } catch {
      setError("Network problem. Try again.");
    }
    setBusy(false);
  }

  const step = found ? STEPS.indexOf(found.status) : -1;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
        Track your order
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        Enter your order number and the mobile number you ordered with.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="orderNo" className="mb-1.5 block text-[13px] text-muted">
            Order number
          </label>
          <input
            id="orderNo"
            name="orderNo"
            required
            placeholder="KS-2026-0001"
            className="tnum h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-text outline-none placeholder:text-muted focus:border-gold"
          />
        </div>
        <div>
          <label htmlFor="mobile" className="mb-1.5 block text-[13px] text-muted">
            Mobile number
          </label>
          <input
            id="mobile"
            name="mobile"
            inputMode="numeric"
            required
            placeholder="10 digits"
            className="tnum h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-text outline-none placeholder:text-muted focus:border-gold"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-xl bg-gold text-[15px] font-bold text-[#1a1200] disabled:opacity-50"
        >
          {busy ? "Checking..." : "Find my order"}
        </button>
      </form>

      {error && (
        <p className="mt-5 rounded-xl border border-ember/40 bg-ember/10 p-3.5 text-[14px] text-ember">
          {error}
        </p>
      )}

      {found && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <p className="tnum text-[13px] text-muted">{found.orderNo}</p>
          <p className="tnum text-2xl font-black text-gold-soft">
            Rs {formatINRPlain(found.total)}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {found.itemCount} line{found.itemCount === 1 ? "" : "s"} &middot; placed{" "}
            {new Date(found.createdAt).toLocaleDateString("en-IN")}
          </p>

          {found.status === "cancelled" ? (
            <p className="mt-4 rounded-xl bg-ember/10 p-3 text-[14px] text-ember">
              This order was cancelled. Please call us if that is unexpected.
            </p>
          ) : (
            <ol className="mt-5 space-y-2.5">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                      i <= step ? "bg-good/20 text-good" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {i <= step ? "✓" : i + 1}
                  </span>
                  <span
                    className={`text-[14px] ${i <= step ? "text-text" : "text-muted"}`}
                  >
                    {LABEL[s]}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-4 text-[13px] text-muted">
            Payment: <strong className="text-text">{found.paymentStatus.replace("_", " ")}</strong>
          </p>

          <Link
            href={found.link}
            className="mt-4 inline-block rounded-xl border border-line px-4 py-2.5 text-[14px] font-semibold text-text"
          >
            View full order
          </Link>
        </section>
      )}
    </main>
  );
}
