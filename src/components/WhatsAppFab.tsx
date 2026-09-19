import { shop } from "@/lib/shop";
import { buildWhatsAppLink } from "@/lib/upi";

// Sits above the cart bar so the two never overlap on mobile.
export function WhatsAppFab() {
  const href = buildWhatsAppLink(
    `91${shop.phones[0]}`,
    `Hello ${shop.brandName}, I would like to know more about your 2026 price list.`,
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-28 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-good text-[#06281c] shadow-lg shadow-black/40"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.1 4 4.1-1.07A9.9 9.9 0 1 0 12.04 2m0 1.8a8.1 8.1 0 1 1-4.13 15.06l-.3-.18-2.44.64.65-2.37-.19-.31A8.1 8.1 0 0 1 12.04 3.8m-3.2 4.02c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.68 2.68 4.16 3.65 2.06.8 2.48.64 2.93.6.45-.04 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41z" />
      </svg>
    </a>
  );
}
