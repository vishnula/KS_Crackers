// UPI intent links. No payment gateway is involved — this deep-links the
// customer's own GPay/PhonePe/Paytm with amount and order no. pre-filled.
// See PLAN.md §5 for why a gateway is not an option for this category.

export type UpiIntentArgs = {
  vpa: string; // payee VPA, e.g. kscrackers@okicici
  payeeName: string;
  amount: number; // must already carry the unique paise, see format.ts
  orderNo: string;
};

export function buildUpiIntent({ vpa, payeeName, amount, orderNo }: UpiIntentArgs): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderNo}`,
  });
  return `upi://pay?${params.toString()}`;
}

// Same payload, rendered as a QR for desktop users.
export function upiQrPayload(args: UpiIntentArgs): string {
  return buildUpiIntent(args);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// UTR is the 12-digit reference the customer reads off his UPI app.
export function isValidUtr(utr: string): boolean {
  return /^\d{12}$/.test(utr.trim());
}
