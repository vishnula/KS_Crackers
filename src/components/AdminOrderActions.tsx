"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["new", "confirmed", "packed", "dispatched", "delivered"];

export function AdminOrderActions({
  orderNo,
  status,
  paymentStatus,
  utr,
}: {
  orderNo: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  utr: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [utrInput, setUtrInput] = useState(utr ?? "");

  async function patch(body: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Update failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network problem");
    }
    setBusy(false);
  }

  const next = FLOW[FLOW.indexOf(status) + 1];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[13px] text-muted">Order status</p>
        <div className="flex flex-wrap gap-2">
          {next && (
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ status: next })}
              className="h-11 rounded-xl bg-gold px-4 text-[14px] font-bold text-[#1a1200] disabled:opacity-50"
            >
              Mark {next}
            </button>
          )}
          {status !== "cancelled" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ status: "cancelled" })}
              className="h-11 rounded-xl border border-ember/50 px-4 text-[14px] font-semibold text-ember disabled:opacity-50"
            >
              Cancel order
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] text-muted">Payment</p>
        <div className="flex flex-wrap gap-2">
          {(["unpaid", "advance_paid", "paid"] as PaymentStatus[]).map((p) => (
            <button
              key={p}
              type="button"
              disabled={busy || paymentStatus === p}
              onClick={() => patch({ paymentStatus: p })}
              className={`h-11 rounded-xl border px-4 text-[14px] font-semibold disabled:opacity-40 ${
                paymentStatus === p
                  ? "border-good bg-good/15 text-good"
                  : "border-line text-text"
              }`}
            >
              {p.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="utr" className="mb-2 block text-[13px] text-muted">
          UTR / payment reference
        </label>
        <div className="flex gap-2">
          <input
            id="utr"
            value={utrInput}
            inputMode="numeric"
            placeholder="12 digit UTR"
            onChange={(e) => setUtrInput(e.target.value)}
            className="tnum h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-[14px] text-text outline-none focus:border-gold"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ utr: utrInput })}
            className="h-11 rounded-xl border border-line px-4 text-[14px] font-semibold text-text disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {error && <p className="text-[13px] text-ember">{error}</p>}
    </div>
  );
}
