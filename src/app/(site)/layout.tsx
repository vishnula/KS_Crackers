import { CartProvider } from "@/components/CartProvider";
import { CartBar } from "@/components/CartBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    // Cart sits above the router so it survives navigation between pages.
    <CartProvider>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <WhatsAppFab />
      <CartBar />
    </CartProvider>
  );
}
