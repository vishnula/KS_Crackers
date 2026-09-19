"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatINRPlain } from "@/lib/format";
import { clearCart } from "@/lib/cartStore";

const STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "Maharashtra", "Gujarat", "Delhi", "Puducherry", "Other",
];

const FIELD =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-text outline-none placeholder:text-muted focus:border-gold";

export default function CheckoutPage() {
  const router = useRouter();
  const { totals, qtys } = useCart();
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setSaving(true);

    const data = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(data.entries()),
      lines: Object.entries(qtys).map(([code, qty]) => ({ code: Number(code), qty })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.errors ?? ["Could not place the order. Please try again."]);
        setSaving(false);
        return;
      }
      clearCart();
      router.push(`/order/${json.orderNo}`);
    } catch {
      setErrors(["Network problem. Check your connection and try again."]);
      setSaving(false);
    }
  }

  if (totals.itemCount === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-text">Your cart is empty</h1>
        <p className="mt-2 text-[14px] text-muted">
          Add items from the price list to place an order.
        </p>
        <Link
          href="/pricelist"
          className="mt-6 inline-block rounded-xl bg-gold px-6 py-3.5 text-[15px] font-bold text-[#1a1200]"
        >
          View Price List
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
        Place your order
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        We will call you to confirm stock, packing and transport before dispatch. No
        payment is taken on this page.
      </p>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">Order summary</h2>
        <dl className="mt-3 space-y-1.5 text-[14px]">
          <div className="flex justify-between text-muted">
            <dt>{totals.itemCount} items</dt>
            <dd className="tnum">Rs {formatINRPlain(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Packing charges ({totals.packingChargePct}%)</dt>
            <dd className="tnum">Rs {formatINRPlain(totals.packingCharge)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-[17px] font-bold text-gold-soft">
            <dt>Total</dt>
            <dd className="tnum">Rs {formatINRPlain(totals.total)}</dd>
          </div>
          {totals.savings > 0 && (
            <p className="tnum pt-1 text-[13px] text-good">
              You save Rs {formatINRPlain(totals.savings)} on price list rates
            </p>
          )}
        </dl>
        <Link href="/pricelist" className="mt-3 inline-block text-[13px] text-gold">
          Edit items
        </Link>
      </section>

      {errors.length > 0 && (
        <ul className="mt-5 space-y-1 rounded-2xl border border-ember/40 bg-ember/10 p-4 text-[14px] text-ember">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="customerName" className="mb-1.5 block text-[13px] text-muted">
            Full name
          </label>
          <input id="customerName" name="customerName" required className={FIELD} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="mb-1.5 block text-[13px] text-muted">
              WhatsApp number <span className="opacity-60">(optional)</span>
            </label>
            <input id="whatsapp" name="whatsapp" inputMode="numeric" className={FIELD} />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] text-muted">
            Email <span className="opacity-60">(optional)</span>
          </label>
          <input id="email" name="email" type="email" className={FIELD} />
        </div>

        <div>
          <label htmlFor="address" className="mb-1.5 block text-[13px] text-muted">
            Delivery address
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={3}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-text outline-none placeholder:text-muted focus:border-gold"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className="mb-1.5 block text-[13px] text-muted">
              City / Town
            </label>
            <input id="city" name="city" required className={FIELD} />
          </div>
          <div>
            <label htmlFor="state" className="mb-1.5 block text-[13px] text-muted">
              State
            </label>
            <select id="state" name="state" required defaultValue="Tamil Nadu" className={FIELD}>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pincode" className="mb-1.5 block text-[13px] text-muted">
              Pincode
            </label>
            <input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              required
              placeholder="6 digits"
              className={FIELD}
            />
          </div>
        </div>

        <div>
          <label htmlFor="transportPref" className="mb-1.5 block text-[13px] text-muted">
            Preferred transport / parcel service <span className="opacity-60">(optional)</span>
          </label>
          <input id="transportPref" name="transportPref" className={FIELD} />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-[13px] text-muted">
            Notes for us <span className="opacity-60">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-text outline-none focus:border-gold"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-14 w-full rounded-xl bg-gold text-[16px] font-bold text-[#1a1200] disabled:opacity-50"
        >
          {saving ? "Placing order..." : `Place order - Rs ${formatINRPlain(totals.total)}`}
        </button>
      </form>
    </main>
  );
}
