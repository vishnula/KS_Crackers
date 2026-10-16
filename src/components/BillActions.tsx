"use client";

import { buildWhatsAppLink } from "@/lib/upi";

// The owner works from a phone, so there are two ways out: print (Chrome's
// print dialog has "Save as PDF", which he can then attach) and a plain-text
// bill straight into the customer's WhatsApp, which is what most will use.
export function BillActions({
  mobile,
  message,
}: {
  mobile: string;
  message: string;
}) {
  return (
    <div className="no-print mb-5 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="h-11 rounded-xl bg-gold px-4 text-[14px] font-bold text-[#1a1200]"
      >
        Print / Save as PDF
      </button>
      <a
        href={buildWhatsAppLink(`91${mobile}`, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 items-center rounded-xl border border-good/50 bg-good/10 px-4 text-[14px] font-semibold text-good"
      >
        Send bill on WhatsApp
      </a>
    </div>
  );
}
